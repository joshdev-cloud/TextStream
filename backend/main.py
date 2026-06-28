import os
import json
import shutil
import time
import collections
import re
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Optional

from config import Config
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="TextStream API Backend", version="2.0")

# ──────────────────────────── Security State & Tasks ────────────────────────────
RATE_LIMIT_STANDARD = 60
RATE_LIMIT_STRICT = 10
RATE_LIMIT_CHALLENGE = 20
WINDOW_SIZE = 60
PAYLOAD_WINDOW_SIZE = 900 # 15 minutes
MAX_PAYLOAD_BYTES = 50 * 1024 * 1024 # 50 MB

BOT_USER_AGENTS = ["gptbot", "claudebot", "bytesspider", "ccbot"]

JAILBREAK_PATTERN = re.compile(
    r"\b(ignore\s+(all\s+)?previous\s+instructions|system\s+prompt\s+override|disregard\s+the\s+above)\b", 
    re.IGNORECASE
)

class RateLimiterStore:
    def __init__(self):
        self.use_redis = os.getenv("USE_REDIS", "false").lower() == "true"
        self.standard = collections.defaultdict(list)
        self.strict = collections.defaultdict(list)
        self.challenge = collections.defaultdict(list)
        self.payload = collections.defaultdict(list)
        
    def check_rate_limit(self, store_type: str, client_ip: str, limit: int, current_time: float, window: int = WINDOW_SIZE):
        store = getattr(self, store_type)
        store[client_ip][:] = [t for t in store[client_ip] if current_time - t < window]
        if len(store[client_ip]) >= limit:
            return False
        store[client_ip].append(current_time)
        return True

    def check_payload_limit(self, client_ip: str, payload_size: int, current_time: float):
        self.payload[client_ip][:] = [(t, s) for t, s in self.payload[client_ip] if current_time - t < PAYLOAD_WINDOW_SIZE]
        current_sum = sum(s for t, s in self.payload[client_ip])
        if current_sum + payload_size > MAX_PAYLOAD_BYTES:
            return False
        self.payload[client_ip].append((current_time, payload_size))
        return True

rate_limiter = RateLimiterStore()

TASK_STORE = {}

def cleanup_tasks():
    current_time = time.time()
    keys_to_delete = [k for k, v in TASK_STORE.items() if current_time - v.get("created_at", current_time) > 3600]
    for k in keys_to_delete:
        del TASK_STORE[k]

def detect_prompt_injection(text: str) -> bool:
    if not text: return False
    return bool(JAILBREAK_PATTERN.search(text))

BOT_USER_AGENTS = ["gptbot", "claudebot", "bytesspider", "ccbot"]

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path
        user_agent = (request.headers.get("user-agent") or "").lower()
        
        # 1. Bot Protection
        for bot in BOT_USER_AGENTS:
            if bot in user_agent:
                return JSONResponse(status_code=403, content={"detail": "Access Denied: Automated bots are not allowed."})
                
        current_time = time.time()

        # 2. Payload Size Limit for /api/upload
        if path == "/api/upload":
            content_length = request.headers.get("content-length")
            if content_length:
                size = int(content_length)
                if size > 15 * 1024 * 1024:
                    return JSONResponse(status_code=413, content={"detail": "Payload Too Large: Maximum upload size is 15MB."})
                if not rate_limiter.check_payload_limit(client_ip, size, current_time):
                    return JSONResponse(status_code=429, content={"detail": "Too Many Requests: Payload size limit exceeded."})
        
        # 3. Rate Limiting
        if path in ["/api/upload", "/api/quiz", "/api/search_web_pdf"]:
            if not rate_limiter.check_rate_limit("strict", client_ip, RATE_LIMIT_STRICT, current_time):
                return JSONResponse(status_code=429, content={"detail": "Too Many Requests: Strict rate limit exceeded."})
        else:
            if not rate_limiter.check_rate_limit("standard", client_ip, RATE_LIMIT_STANDARD, current_time):
                return JSONResponse(status_code=429, content={"detail": "Too Many Requests: Standard rate limit exceeded."})

        # 4. Challenge suspicious traffic patterns on text-gen routes
        if path in ["/api/chat", "/api/summarize", "/api/quiz"]:
            if not rate_limiter.check_rate_limit("challenge", client_ip, RATE_LIMIT_CHALLENGE, current_time):
                return JSONResponse(
                    status_code=403, 
                    content={"challenge_required": True, "message": "Suspicious traffic detected."}
                )

        # 5. Process request
        response = await call_next(request)
        
        # 6. Downstream Security Headers
        api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = f"default-src 'self'; script-src 'self'; connect-src 'self' {api_base} https://api.openai.com https://api.anthropic.com; object-src 'none';"
        
        return response

app.add_middleware(SecurityMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=503,
        content={"status": 503, "message": "The system is currently handling high volume. Please try again shortly."}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code >= 500:
        return JSONResponse(
            status_code=503,
            content={"status": 503, "message": "The system is currently handling high volume. Please try again shortly."}
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

supabase: Client | None = None
if Config.SUPABASE_URL and Config.SUPABASE_ANON_KEY:
    supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)

def get_current_user(authorization: str = Header(None)) -> str:
    if not supabase:
        return "global"
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_resp.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://textstream.app"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(Config.DOCS_DIR):
    os.makedirs(Config.DOCS_DIR)

app.mount("/documents", StaticFiles(directory=Config.DOCS_DIR), name="documents")

# ──────────────────────────── Shared State ────────────────────────────

embeddings = None
vector_stores = {}

# ──────────────────────────── Request / Response Models ────────────────────────────

class ChatRequest(BaseModel):
    question: str
    model: str = "velocity"
    document_names: List[str] = []
    user_name: Optional[str] = None
    user_age: Optional[int] = None
    user_gender: Optional[str] = None

class SourceMetadata(BaseModel):
    source: str
    page: Optional[int] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceMetadata]

class SummarizeRequest(BaseModel):
    document_names: List[str] = []
    model: str = "velocity"

class SummarizeResponse(BaseModel):
    takeaways: List[str]
    terminology: List[str]
    insights: str

class QuizRequest(BaseModel):
    document_names: List[str] = []
    model: str = "velocity"
    question_count: int = 5
    difficulty: int = 50

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class DocumentInfo(BaseModel):
    name: str
    size_bytes: int

class SearchWebRequest(BaseModel):
    query: str

class IngestArxivRequest(BaseModel):
    title: str
    pdf_url: str

# ──────────────────────────── Helpers ────────────────────────────

def get_llm(model_key: str, temperature: float = 0.1):
    if model_key == "deep":
        return ChatGoogleGenerativeAI(
            google_api_key=Config.GEMINI_API_KEY,
            model=Config.GEMINI_MODEL,
            temperature=temperature,
        )
    else:
        return ChatGroq(
            groq_api_key=Config.GROQ_API_KEY,
            model_name=Config.GROQ_MODEL,
            temperature=temperature,
        )

def get_embeddings():
    global embeddings
    if embeddings is None:
        print("[Embedding] Loading model (all-MiniLM-L6-v2)...")
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return embeddings

def get_vector_store(user_id: str):
    global vector_stores
    if user_id not in vector_stores or vector_stores[user_id] is None:
        emb = get_embeddings()
        db_path = os.path.join(Config.DB_DIR, user_id)
        if os.path.exists(db_path) and len(os.listdir(db_path)) > 0:
            print(f"[VectorStore] Loading existing ChromaDB for user: {user_id}")
            vector_stores[user_id] = Chroma(persist_directory=db_path, embedding_function=emb)
        else:
            rebuild_vector_store(user_id)
    return vector_stores.get(user_id)

def rebuild_vector_store(user_id: str):
    global vector_stores
    emb = get_embeddings()
    user_docs_dir = os.path.join(Config.DOCS_DIR, user_id)
    db_path = os.path.join(Config.DB_DIR, user_id)

    if not os.path.exists(user_docs_dir):
        os.makedirs(user_docs_dir)

    all_docs = []
    for filename in os.listdir(user_docs_dir):
        filepath = os.path.join(user_docs_dir, filename)
        if filename.lower().endswith(".pdf"):
            try:
                loader = PyPDFLoader(filepath)
                all_docs.extend(loader.load())
            except Exception as e:
                print(f"[Warning] Failed to load PDF {filename}: {e}")
        elif filename.lower().endswith(".txt"):
            try:
                loader = TextLoader(filepath)
                all_docs.extend(loader.load())
            except Exception as e:
                print(f"[Warning] Failed to load TXT {filename}: {e}")

    if not all_docs:
        print(f"[Warning] Documents folder for {user_id} is empty.")
        vector_stores[user_id] = Chroma(persist_directory=db_path, embedding_function=emb)
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=Config.CHUNK_SIZE,
        chunk_overlap=Config.CHUNK_OVERLAP,
    )
    text_chunks = splitter.split_documents(all_docs)

    for chunk in text_chunks:
        chunk.metadata["source"] = os.path.basename(chunk.metadata.get("source", "unknown"))

    if vector_stores.get(user_id) is not None:
        try:
            if hasattr(vector_stores[user_id], '_client'):
                vector_stores[user_id]._client.reset()
            vector_stores[user_id] = None
        except Exception as e:
            print(f"[Warning] Could not cleanly close vector store: {e}")

    if os.path.exists(db_path):
        try:
            shutil.rmtree(db_path)
        except Exception as e:
            print(f"[Warning] Could not delete old DB dir: {e}")

    vector_stores[user_id] = Chroma.from_documents(
        documents=text_chunks,
        embedding=emb,
        persist_directory=db_path,
    )
    print(f"[Success] Rebuilt vector store for {user_id}")


def ingest_single_file(filepath: str, user_id: str):
    global vector_stores
    emb = get_embeddings()
    filename = os.path.basename(filepath)
    db_path = os.path.join(Config.DB_DIR, user_id)

    docs = []
    if filename.lower().endswith(".pdf"):
        loader = PyPDFLoader(filepath)
        docs = loader.load()
    elif filename.lower().endswith(".txt"):
        loader = TextLoader(filepath)
        docs = loader.load()

    if not docs:
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=Config.CHUNK_SIZE,
        chunk_overlap=Config.CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(docs)

    for chunk in chunks:
        chunk.metadata["source"] = os.path.basename(chunk.metadata.get("source", "unknown"))

    vs = vector_stores.get(user_id)
    if vs is None:
        vector_stores[user_id] = Chroma.from_documents(
            documents=chunks,
            embedding=emb,
            persist_directory=db_path,
        )
    else:
        vs.add_documents(chunks)
        vs.persist()

def build_filtered_retriever(document_names: List[str], user_id: str, k: int = None):
    vs = get_vector_store(user_id)
    if vs is None:
        return None

    top_k = k or Config.TOP_K_RESULTS

    if document_names and len(document_names) > 0:
        search_filter = {"source": {"$in": document_names}}
        return vs.as_retriever(
            search_type="mmr",
            search_kwargs={"k": top_k, "fetch_k": min(top_k * 4, 100), "filter": search_filter}
        )
    else:
        return vs.as_retriever(
            search_type="mmr",
            search_kwargs={"k": top_k, "fetch_k": min(top_k * 4, 100)}
        )

# ──────────────────────────── API Endpoints ────────────────────────────

@app.on_event("startup")
async def startup_event():
    print("[System] Initializing TextStream Core Systems...")
    get_vector_store("global")

@app.get("/api/tasks/{task_id}")
def get_task_status(task_id: str):
    cleanup_tasks()
    task = TASK_STORE.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_documents(request: ChatRequest, user_id: str = Depends(get_current_user)):
    if detect_prompt_injection(request.question):
        raise HTTPException(status_code=403, detail="Blocked: Potential prompt injection detected.")

    retriever = build_filtered_retriever(request.document_names, user_id)
    if retriever is None:
        raise HTTPException(status_code=400, detail="No documents indexed.")

    llm = get_llm(request.model)

    user_context = ""
    if request.user_name or request.user_age or request.user_gender:
        user_context = f"\n\nUSER PROFILE CONTEXT:\nYou are speaking with {request.user_name or 'a user'}."
        if request.user_age:
            user_context += f" They are {request.user_age} years old."
        if request.user_gender and request.user_gender != "Prefer not to say":
            user_context += f" Their gender is {request.user_gender}."

    prompt_blueprint = (
        "You are TextStream — a highly intelligent and articulate AI assistant. "
        "Your primary goal is to provide comprehensive answers based strictly on the provided documents.\n\n"
        "STYLE AND BEHAVIOR RULES:\n"
        "- Write with elegant, impeccable grammar.\n"
        "- DO NOT use markdown bolding (e.g., **text**).\n"
        "- DO use bullet points to clearly organize.\n"
        "- Maintain an academic tone.\n"
        "- ALWAYS ground your answers in the provided text.\n"
        "- If the answer cannot be found in the context, state that explicitly.\n"
        f"{user_context}\n\n"
        "Context from the user's documents:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_blueprint),
        ("human", "{input}"),
    ])

    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)

    try:
        output = rag_chain.invoke({"input": request.question})
        sources_list = []
        seen = set()
        for doc in output.get("context", []):
            path = os.path.basename(doc.metadata.get("source", "Unknown"))
            page = doc.metadata.get("page", None)
            label = f"{path}-page-{page}" if page is not None else path

            if label not in seen:
                sources_list.append(SourceMetadata(source=path, page=page + 1 if page is not None else None))
                seen.add(label)

        return ChatResponse(answer=output["answer"], sources=sources_list)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/summarize", response_model=SummarizeResponse)
def summarize_documents(request: SummarizeRequest, user_id: str = Depends(get_current_user)):
    retriever = build_filtered_retriever(request.document_names, user_id, k=12)
    if retriever is None:
        raise HTTPException(status_code=400, detail="No documents indexed.")

    llm = get_llm(request.model)

    summary_prompt = (
        "You are TextStream. Analyze these excerpts and produce a summary.\n\n"
        "You MUST respond with valid JSON in this exact format:\n"
        '{{\n'
        '  "takeaways": ["Takeaway 1", "Takeaway 2"],\n'
        '  "terminology": ["term1"],\n'
        '  "insights": "A comprehensive paragraph synthesizing the themes."\n'
        '}}\n\n'
        "Document excerpts:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", summary_prompt),
        ("human", "Generate a comprehensive study summary of these documents."),
    ])

    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)

    try:
        query_text = " ".join(request.document_names) + " comprehensive summary" if request.document_names else "comprehensive summary"
        output = rag_chain.invoke({"input": query_text})
        raw_answer = output["answer"]

        cleaned = raw_answer.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        try:
            parsed = json.loads(cleaned.strip())
        except:
            parsed = {"takeaways": [raw_answer[:200]], "terminology": [], "insights": raw_answer}

        return SummarizeResponse(
            takeaways=parsed.get("takeaways", []),
            terminology=parsed.get("terminology", []),
            insights=parsed.get("insights", ""),
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

def process_quiz_task(task_id: str, request: QuizRequest, user_id: str):
    try:
        retriever = build_filtered_retriever(request.document_names, user_id, k=15)
        if retriever is None:
            TASK_STORE[task_id] = {"status": "failed", "error": "No documents indexed."}
            return

        llm = get_llm(request.model, temperature=0.7)
        difficulty_label = "easy" if request.difficulty < 33 else "challenging" if request.difficulty < 66 else "very hard exam-level"

        quiz_prompt = (
            f"Create exactly {request.question_count} rigorous multiple-choice questions at {difficulty_label} difficulty.\n\n"
            "You MUST respond with valid JSON:\n"
            '{{\n'
            '  "questions": [\n'
            '    {{\n'
            '      "question": "Text",\n'
            '      "options": ["A", "B", "C", "D"],\n'
            '      "correct_index": 0,\n'
            '      "explanation": "Why correct"\n'
            '    }}\n'
            '  ]\n'
            '}}\n\n'
            "Document excerpts:\n{context}"
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", quiz_prompt),
            ("human", f"Generate {request.question_count} quiz questions."),
        ])

        qa_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, qa_chain)

        query_text = " ".join(request.document_names) + " quiz concepts" if request.document_names else "quiz concepts"
        output = rag_chain.invoke({"input": query_text})
        raw_answer = output["answer"]

        cleaned = raw_answer.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        try:
            parsed = json.loads(cleaned.strip())
        except:
            TASK_STORE[task_id] = {"status": "completed", "result": {"questions": []}}
            return

        questions = []
        for q in parsed.get("questions", []):
            options = q.get("options", [])
            while len(options) < 4:
                options.append("(No option)")
            questions.append({
                "question": q.get("question", "Question"),
                "options": options[:4],
                "correct_index": min(q.get("correct_index", 0), 3),
                "explanation": q.get("explanation", "None"),
            })
            
        TASK_STORE[task_id] = {"status": "completed", "result": {"questions": questions}}
    except Exception as err:
        TASK_STORE[task_id] = {"status": "failed", "error": str(err)}

@app.post("/api/quiz")
async def generate_quiz(request: QuizRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    cleanup_tasks()
    task_id = str(uuid.uuid4())
    TASK_STORE[task_id] = {"status": "processing", "created_at": time.time()}
    background_tasks.add_task(process_quiz_task, task_id, request, user_id)
    return JSONResponse(status_code=202, content={"task_id": task_id, "status": "processing"})

def process_upload_task(task_id: str, filepath: str, safe_filename: str, user_id: str):
    try:
        paragraphs = []
        pages = 1
        if safe_filename.lower().endswith(".pdf"):
            loader = PyPDFLoader(filepath)
            docs = loader.load()
            pages = len(docs)
            for doc in docs:
                paragraphs.extend(doc.page_content.split("\n\n"))
        elif safe_filename.lower().endswith(".txt"):
            loader = TextLoader(filepath)
            docs = loader.load()
            for doc in docs:
                paragraphs.extend(doc.page_content.split("\n\n"))

        paragraphs = [p.strip() for p in paragraphs if len(p.strip()) > 0]

        full_text = " ".join(paragraphs)
        if detect_prompt_injection(full_text):
            TASK_STORE[task_id] = {"status": "failed", "error": "Blocked: Payload contains prompt injection signatures."}
            return

        ingest_single_file(filepath, user_id)

        TASK_STORE[task_id] = {
            "status": "completed", 
            "result": {
                "success": True,
                "filename": safe_filename,
                "message": f"Indexed {safe_filename}.",
                "pages": pages,
                "paragraphs": paragraphs
            }
        }
    except Exception as err:
        TASK_STORE[task_id] = {"status": "failed", "error": str(err)}

@app.post("/api/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    cleanup_tasks()
    user_docs_dir = os.path.join(Config.DOCS_DIR, user_id)
    if not os.path.exists(user_docs_dir):
        os.makedirs(user_docs_dir)

    safe_filename = os.path.basename(file.filename)
    if not safe_filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and TXT allowed.")

    filepath = os.path.join(user_docs_dir, safe_filename)
    try:
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        task_id = str(uuid.uuid4())
        TASK_STORE[task_id] = {"status": "processing", "created_at": time.time()}
        background_tasks.add_task(process_upload_task, task_id, filepath, safe_filename, user_id)

        return JSONResponse(status_code=202, content={"task_id": task_id, "status": "processing"})
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/sync")
def sync_documents(user_id: str = "global"):
    try:
        rebuild_vector_store(user_id)
        return {"success": True, "message": "Rebuilt from documents folder."}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.get("/api/documents")
def list_documents(user_id: str = "global"):
    user_docs_dir = os.path.join(Config.DOCS_DIR, user_id)
    if not os.path.exists(user_docs_dir):
        return {"documents": []}

    docs = []
    for filename in os.listdir(user_docs_dir):
        filepath = os.path.join(user_docs_dir, filename)
        if os.path.isfile(filepath) and (filename.lower().endswith(".pdf") or filename.lower().endswith(".txt")):
            docs.append(DocumentInfo(name=filename, size_bytes=os.path.getsize(filepath)))

    return {"documents": docs}

@app.get("/api/search_arxiv")
def search_arxiv(q: str):
    import urllib.request
    import xml.etree.ElementTree as ET
    
    query_encoded = urllib.parse.quote(q)
    api_url = f"http://export.arxiv.org/api/query?search_query=all:{query_encoded}&start=0&max_results=5"
    
    try:
        response = urllib.request.urlopen(api_url)
        xml_data = response.read()
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        results = []
        for entry in root.findall("atom:entry", ns):
            title = entry.find("atom:title", ns).text.strip()
            summary = entry.find("atom:summary", ns).text.strip()
            
            authors = []
            for author in entry.findall("atom:author", ns):
                name = author.find("atom:name", ns).text.strip()
                authors.append(name)
                
            pdf_url = None
            for link in entry.findall("atom:link", ns):
                if link.attrib.get("title") == "pdf":
                    pdf_url = link.attrib.get("href")
                    break
            
            if pdf_url:
                results.append({
                    "title": title,
                    "summary": summary,
                    "authors": authors,
                    "pdf_url": pdf_url
                })
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_ingest_arxiv_task(task_id: str, request: IngestArxivRequest, user_id: str):
    import urllib.request
    import re
    
    try:
        pdf_url = request.pdf_url
        if not pdf_url.endswith(".pdf"):
            pdf_url += ".pdf"
            
        filename = re.sub(r'[\\/*?:"<>|]', "", request.title)[:100] + ".pdf"
        
        user_docs_dir = os.path.join(Config.DOCS_DIR, user_id)
        if not os.path.exists(user_docs_dir):
            os.makedirs(user_docs_dir)
            
        filepath = os.path.join(user_docs_dir, filename)
        
        req = urllib.request.Request(pdf_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response_pdf, open(filepath, 'wb') as out_file:
            out_file.write(response_pdf.read())
            
        paragraphs = []
        pages = 1
        loader = PyPDFLoader(filepath)
        docs = loader.load()
        pages = len(docs)
        for doc in docs:
            paragraphs.extend(doc.page_content.split("\n\n"))
            
        paragraphs = [p.strip() for p in paragraphs if len(p.strip()) > 0]

        full_text = " ".join(paragraphs)
        if detect_prompt_injection(full_text):
            TASK_STORE[task_id] = {"status": "failed", "error": "Blocked: Payload contains prompt injection signatures."}
            return

        ingest_single_file(filepath, user_id)
        
        TASK_STORE[task_id] = {
            "status": "completed", 
            "result": {
                "success": True,
                "filename": filename,
                "message": "Downloaded from ArXiv and indexed.",
                "pages": pages,
                "paragraphs": paragraphs
            }
        }
    except Exception as e:
        TASK_STORE[task_id] = {"status": "failed", "error": str(e)}

@app.post("/api/ingest_arxiv")
async def ingest_arxiv(request: IngestArxivRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    cleanup_tasks()
    task_id = str(uuid.uuid4())
    TASK_STORE[task_id] = {"status": "processing", "created_at": time.time()}
    background_tasks.add_task(process_ingest_arxiv_task, task_id, request, user_id)
    return JSONResponse(status_code=202, content={"task_id": task_id, "status": "processing"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)