import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Text Chunking Parameters
    CHUNK_SIZE = 600       
    CHUNK_OVERLAP = 60     
    
    # Internal Paths
    DOCS_DIR = "documents"
    DB_DIR = "chroma_db"
    
    # 2026 Production Inference Models
    DEFAULT_LLM_PROVIDER = "groq"  
    GROQ_MODEL = "llama-3.3-70b-versatile"
    GEMINI_MODEL = "gemini-3.5-flash"
    
    TOP_K_RESULTS = 4