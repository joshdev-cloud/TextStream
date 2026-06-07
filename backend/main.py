import os
import json
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
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

app = FastAPI(title="TextStream API Backend", version="2.0")

# Enable Cross-Origin Resource Sharing (CORS) so your frontend environments can talk to it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────── Shared State ────────────────────────────

embeddings = None
vector_store = None

# ──────────────────────────── Request / Response Models ────────────────────────────

class ChatRequest(BaseModel):
    question: str
    model: str = "velocity"  # "velocity" (Groq) or "deep" (Gemini)
    document_names: List[str] = []  # empty = search all docs

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
    difficulty: int = 50  # 0–100

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

# ──────────────────────────── Helpers ────────────────────────────

def get_llm(model_key: str):
    """Instantiate the correct LLM based on frontend model key."""
    if model_key == "deep":
        return ChatGoogleGenerativeAI(
            google_api_key=Config.GEMINI_API_KEY,
            model=Config.GEMINI_MODEL,
            temperature=0.1,
        )
    else:
        # Default to Groq / Velocity
        return ChatGroq(
            groq_api_key=Config.GROQ_API_KEY,
            model_name=Config.GROQ_MODEL,
            temperature=0.1,
        )


def get_embeddings():
    """Lazy-init and cache the embedding model."""
    global embeddings
    if embeddings is None:
        print("[Embedding] Loading model (all-MiniLM-L6-v2)...")
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return embeddings


def get_vector_store():
    """Lazy-init and cache the ChromaDB vector store."""
    global vector_store
    if vector_store is None:
        emb = get_embeddings()
        if os.path.exists(Config.DB_DIR) and len(os.listdir(Config.DB_DIR)) > 0:
            print("[VectorStore] Loading existing ChromaDB vector store...")
            vector_store = Chroma(persist_directory=Config.DB_DIR, embedding_function=emb)
        else:
            # Build from documents folder
            rebuild_vector_store()
    return vector_store


def rebuild_vector_store():
    """Re-index all documents in the documents folder into ChromaDB."""
    global vector_store
    emb = get_embeddings()

    if not os.path.exists(Config.DOCS_DIR):
        os.makedirs(Config.DOCS_DIR)

    all_docs = []
    for filename in os.listdir(Config.DOCS_DIR):
        filepath = os.path.join(Config.DOCS_DIR, filename)
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
        print("[Warning] Documents folder is empty. Upload files to get started.")
        # Create an empty vector store
        vector_store = Chroma(persist_directory=Config.DB_DIR, embedding_function=emb)
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=Config.CHUNK_SIZE,
        chunk_overlap=Config.CHUNK_OVERLAP,
    )
    text_chunks = splitter.split_documents(all_docs)

    # Normalize source metadata to just the filename (not full path)
    for chunk in text_chunks:
        chunk.metadata["source"] = os.path.basename(chunk.metadata.get("source", "unknown"))

    # Close existing vector store to release file locks (critical for Windows)
    if vector_store is not None:
        try:
            # Release the underlying Chroma client connection
            if hasattr(vector_store, '_client'):
                vector_store._client.reset()
            vector_store = None
        except Exception as e:
            print(f"[Warning] Could not cleanly close existing vector store: {e}")
            vector_store = None

    # Wipe and rebuild
    if os.path.exists(Config.DB_DIR):
        try:
            shutil.rmtree(Config.DB_DIR)
        except Exception as e:
            print(f"[Warning] Could not delete old DB dir (will overwrite): {e}")

    vector_store = Chroma.from_documents(
        documents=text_chunks,
        embedding=emb,
        persist_directory=Config.DB_DIR,
    )
    print(f"[Success] Vector store rebuilt with {len(text_chunks)} chunks from {len(set(c.metadata['source'] for c in text_chunks))} files.")


def ingest_single_file(filepath: str):
    """Add a single file to the existing vector store without full rebuild."""
    global vector_store
    emb = get_embeddings()
    filename = os.path.basename(filepath)

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

    # Normalize source
    for chunk in chunks:
        chunk.metadata["source"] = os.path.basename(chunk.metadata.get("source", "unknown"))

    if vector_store is None:
        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=emb,
            persist_directory=Config.DB_DIR,
        )
    else:
        vector_store.add_documents(chunks)

    print(f"[Success] Ingested {len(chunks)} chunks from {filename}")


def build_filtered_retriever(document_names: List[str], k: int = None):
    """Build a retriever that optionally filters by source document names."""
    vs = get_vector_store()
    if vs is None:
        return None

    top_k = k or Config.TOP_K_RESULTS

    if document_names and len(document_names) > 0:
        # ChromaDB where filter: source must be one of the specified filenames
        search_filter = {"source": {"$in": document_names}}
        return vs.as_retriever(
            search_kwargs={"k": top_k, "filter": search_filter}
        )
    else:
        return vs.as_retriever(search_kwargs={"k": top_k})


# ──────────────────────────── Startup ────────────────────────────

@app.on_event("startup")
async def startup_event():
    print("[System] Initializing TextStream Core Systems...")
    get_vector_store()
    print("[Success] TextStream backend ready.")


# ──────────────────────────── API Endpoints ────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_documents(request: ChatRequest):
    """Chat about documents using RAG with the selected AI model."""
    retriever = build_filtered_retriever(request.document_names)
    if retriever is None:
        raise HTTPException(status_code=400, detail="No documents indexed. Upload files first.")

    llm = get_llm(request.model)

    prompt_blueprint = (
        "You are TextStream — a sharp, modern AI study buddy who makes learning feel effortless and exciting. "
        "You speak in a natural, conversational tone like a super-smart friend explaining things. "
        "NEVER sound like a textbook or Wikipedia article. Be concise, punchy, and real.\n\n"
        "STYLE RULES:\n"
        "- Use emojis strategically to make key points pop (🔥 📌 💡 ⚡ 🎯 🧠 ✅ 📝 🔍 🚀)\n"
        "- Use bold **key terms** and fun bullet styles\n"
        "- Break complex ideas into bite-sized chunks\n"
        "- Add personality — be encouraging, witty, and engaging\n"
        "- Use analogies and relatable examples when helpful\n"
        "- Keep paragraphs SHORT (2-3 sentences max)\n"
        "- Start with a direct answer, then elaborate\n"
        "- If the context has the answer, USE IT with specific details and page references\n"
        "- If you truly can't find it in the context, say so honestly and offer what you know from general knowledge, clearly marked as 🌐 *from general knowledge*\n\n"
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
                sources_list.append(SourceMetadata(
                    source=path,
                    page=page + 1 if page is not None else None,
                ))
                seen.add(label)

        return ChatResponse(answer=output["answer"], sources=sources_list)

    except Exception as err:
        print(f"[Error] Chat error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


# Legacy endpoint — keep for backwards compatibility
@app.post("/api/query", response_model=ChatResponse)
def query_documents_legacy(request: ChatRequest):
    """Legacy endpoint that forwards to /api/chat."""
    return chat_with_documents(request)


@app.post("/api/summarize", response_model=SummarizeResponse)
def summarize_documents(request: SummarizeRequest):
    """Generate a structured summary of the specified documents."""
    retriever = build_filtered_retriever(request.document_names, k=12)
    if retriever is None:
        raise HTTPException(status_code=400, detail="No documents indexed. Upload files first.")

    llm = get_llm(request.model)

    summary_prompt = (
        "You are TextStream — a sharp, modern AI study buddy. Analyze these document excerpts and produce a structured study summary that's engaging and easy to digest.\n\n"
        "You MUST respond with valid JSON in this exact format (no markdown fences, just raw JSON):\n"
        '{{\n'
        '  "takeaways": ["🔥 takeaway 1", "📌 takeaway 2", ...],\n'
        '  "terminology": ["term1", "term2", ...],\n'
        '  "insights": "A punchy, engaging paragraph connecting the dots between key concepts. Use emojis and bold terms."\n'
        '}}\n\n'
        "STYLE: Start each takeaway with a relevant emoji. Make them punchy and specific — NOT generic filler. "
        "The insights paragraph should feel like a smart friend breaking it down, not a textbook summary. "
        "Provide 4-8 takeaways, 5-10 key terminology terms, and a fire insights paragraph.\n\n"
        "Document excerpts:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", summary_prompt),
        ("human", "Generate a comprehensive study summary of these documents."),
    ])

    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)

    try:
        output = rag_chain.invoke({"input": "Generate a comprehensive study summary of these documents."})
        raw_answer = output["answer"]

        # Parse the JSON response
        # Strip markdown code fences if LLM wraps it
        cleaned = raw_answer.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback: extract what we can
            parsed = {
                "takeaways": [raw_answer[:200]],
                "terminology": [],
                "insights": raw_answer,
            }

        return SummarizeResponse(
            takeaways=parsed.get("takeaways", []),
            terminology=parsed.get("terminology", []),
            insights=parsed.get("insights", ""),
        )

    except Exception as err:
        print(f"[Error] Summarize error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/quiz", response_model=QuizResponse)
def generate_quiz(request: QuizRequest):
    """Generate quiz questions from the specified documents."""
    retriever = build_filtered_retriever(request.document_names, k=15)
    if retriever is None:
        raise HTTPException(status_code=400, detail="No documents indexed. Upload files first.")

    llm = get_llm(request.model)

    difficulty_label = "easy" if request.difficulty < 33 else "challenging" if request.difficulty < 66 else "very hard exam-level"

    quiz_prompt = (
        f"You are TextStream Quiz Master 🎯 — Create exactly {request.question_count} multiple-choice questions "
        f"at a {difficulty_label} difficulty level based on the document excerpts below.\n\n"
        "You MUST respond with valid JSON in this exact format (no markdown fences, just raw JSON):\n"
        '{{\n'
        '  "questions": [\n'
        '    {{\n'
        '      "question": "The question text",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "correct_index": 0,\n'
        '      "explanation": "Why this is the correct answer — keep it short, punchy, and educational with an emoji."\n'
        '    }}\n'
        '  ]\n'
        '}}\n\n'
        "Each question MUST have exactly 4 options. correct_index is 0-based.\n"
        "Make questions that test real understanding, not boring memorization. "
        "Write questions in a natural, conversational style. Make wrong options plausible but clearly wrong to someone who studied.\n\n"
        "Document excerpts:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", quiz_prompt),
        ("human", f"Generate {request.question_count} quiz questions at {difficulty_label} difficulty."),
    ])

    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)

    try:
        output = rag_chain.invoke({
            "input": f"Generate {request.question_count} quiz questions at {difficulty_label} difficulty."
        })
        raw_answer = output["answer"]

        # Parse JSON
        cleaned = raw_answer.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            # Return a fallback question
            return QuizResponse(questions=[
                QuizQuestion(
                    question="The AI could not generate structured quiz questions. Please try again.",
                    options=["Try again", "Change model", "Upload more documents", "Reduce question count"],
                    correct_index=0,
                    explanation="There was a parsing error with the AI response. Try again or switch models.",
                )
            ])

        questions = []
        for q in parsed.get("questions", []):
            options = q.get("options", [])
            # Ensure exactly 4 options
            while len(options) < 4:
                options.append("(No option provided)")
            options = options[:4]

            questions.append(QuizQuestion(
                question=q.get("question", "Question not generated"),
                options=options,
                correct_index=min(q.get("correct_index", 0), 3),
                explanation=q.get("explanation", "No explanation provided."),
            ))

        return QuizResponse(questions=questions)

    except Exception as err:
        print(f"[Error] Quiz error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document, save to documents folder, and index into ChromaDB."""
    if not os.path.exists(Config.DOCS_DIR):
        os.makedirs(Config.DOCS_DIR)

    filepath = os.path.join(Config.DOCS_DIR, file.filename)

    try:
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        print(f"[File] Saved uploaded file: {filepath}")

        # Index into ChromaDB
        ingest_single_file(filepath)

        return {"success": True, "filename": file.filename, "message": f"Indexed {file.filename} into vector store."}

    except Exception as err:
        print(f"[Error] Upload error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/sync")
def sync_documents():
    """Re-index all documents in the documents folder."""
    try:
        rebuild_vector_store()
        return {"success": True, "message": "Vector store rebuilt from documents folder."}
    except Exception as err:
        print(f"[Error] Sync error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@app.get("/api/documents")
def list_documents():
    """List all documents currently in the documents folder."""
    if not os.path.exists(Config.DOCS_DIR):
        return {"documents": []}

    docs = []
    for filename in os.listdir(Config.DOCS_DIR):
        filepath = os.path.join(Config.DOCS_DIR, filename)
        if os.path.isfile(filepath) and (filename.lower().endswith(".pdf") or filename.lower().endswith(".txt")):
            docs.append(DocumentInfo(
                name=filename,
                size_bytes=os.path.getsize(filepath),
            ))

    return {"documents": docs}


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)