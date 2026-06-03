import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from config import Config
from langchain_community.document_loaders import PyPDFDirectoryLoader, DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

app = FastAPI(title="TextStream API Backend", version="1.0")

# Enable Cross-Origin Resource Sharing (CORS) so your frontend environments can talk to it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_chain = None

class QueryRequest(BaseModel):
    question: str

class SourceMetadata(BaseModel):
    source: str
    page: int = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceMetadata]

def initialize_rag():
    global rag_chain
    print("🤖 Initializing TextStream Core Systems...")
    
    if Config.DEFAULT_LLM_PROVIDER == "groq":
        llm = ChatGroq(groq_api_key=Config.GROQ_API_KEY, model_name=Config.GROQ_MODEL, temperature=0.1)
    else:
        llm = ChatGoogleGenerAI(google_api_key=Config.GEMINI_API_KEY, model=Config.GEMINI_MODEL, temperature=0.1)
        
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    if os.path.exists(Config.DB_DIR) and len(os.listdir(Config.DB_DIR)) > 0:
        print("💾 Found existing local vector database snapshot. Loading indexing maps...")
        vector_store = Chroma(persist_directory=Config.DB_DIR, embedding_function=embeddings)
    else:
        print("🗂️ Ingesting raw local documents directory...")
        if not os.path.exists(Config.DOCS_DIR):
            os.makedirs(Config.DOCS_DIR)
        
        pdf_loader = PyPDFDirectoryLoader(Config.DOCS_DIR)
        txt_loader = DirectoryLoader(Config.DOCS_DIR, glob="**/*.txt", loader_cls=TextLoader)
        raw_docs = pdf_loader.load() + txt_loader.load()
        
        if not raw_docs:
            print("⚠️ Documents folder is completely empty. Drop your PDFs inside.")
            return False
            
        splitter = RecursiveCharacterTextSplitter(chunk_size=Config.CHUNK_SIZE, chunk_overlap=Config.CHUNK_OVERLAP)
        text_chunks = splitter.split_documents(raw_docs)
        vector_store = Chroma.from_documents(documents=text_chunks, embedding=embeddings, persist_directory=Config.DB_DIR)
        print("✅ Vector store built successfully.")

    retriever = vector_store.as_retriever(search_kwargs={"k": Config.TOP_K_RESULTS})
    prompt_blueprint = (
        "You are an expert workspace assistant modeled after NotebookLM. Answer the question using ONLY the context provided below. "
        "If you cannot confidently deduce the answer from this data, state: 'I cannot verify that item based on your documents.'\n\n"
        "Context:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([("system", prompt_blueprint), ("human", "{input}")])
    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)
    return True

@app.on_event("startup")
def startup_event():
    initialize_rag()

@app.post("/api/query", response_model=QueryResponse)
def query_documents(request: QueryRequest):
    global rag_chain
    if rag_chain is None:
        success = initialize_rag()
        if not success:
            raise HTTPException(status_code=400, detail="RAG system not initialized. Please add files to your documents folder.")
            
    try:
        output = rag_chain.invoke({"input": request.question})
        
        sources_list = []
        seen = set()
        for doc in output.get("context", []):
            path = os.path.basename(doc.metadata.get("source", "System Fragment"))
            page = doc.metadata.get("page", None)
            label = f"{path}-page-{page}" if page is not None else path
            
            if label not in seen:
                sources_list.append(SourceMetadata(source=path, page=page + 1 if page is not None else None))
                seen.add(label)
                
        return QueryResponse(answer=output["answer"], sources=sources_list)
        
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)