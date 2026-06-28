import os
import sys
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

def initialize_llm():
    if Config.DEFAULT_LLM_PROVIDER == "groq":
        if not Config.GROQ_API_KEY:
            print("❌ Error: GROQ_API_KEY is missing from your local .env file.")
            sys.exit(1)
        return ChatGroq(groq_api_key=Config.GROQ_API_KEY, model_name=Config.GROQ_MODEL, temperature=0.1)
    elif Config.DEFAULT_LLM_PROVIDER == "gemini":
        if not Config.GEMINI_API_KEY:
            print("❌ Error: GEMINI_API_KEY is missing from your local .env file.")
            sys.exit(1)
        return ChatGoogleGenerAI(google_api_key=Config.GEMINI_API_KEY, model=Config.GEMINI_MODEL, temperature=0.1)
    else:
        print(f"❌ Unknown engine choice: {Config.DEFAULT_LLM_PROVIDER}")
        sys.exit(1)

def build_vector_store():
    if not os.path.exists(Config.DOCS_DIR):
        os.makedirs(Config.DOCS_DIR)
        print(f"📁 Generated an empty '{Config.DOCS_DIR}/' folder. Place your reference data files inside.")
        return None

    print("🗂️ Ingesting data structures from the local documents folder...")
    pdf_loader = PyPDFDirectoryLoader(Config.DOCS_DIR)
    txt_loader = DirectoryLoader(Config.DOCS_DIR, glob="**/*.txt", loader_cls=TextLoader)
    raw_docs = pdf_loader.load() + txt_loader.load()
    
    if not raw_docs:
        print("⚠️ Your documents directory is empty. Drop some files inside to proceed.")
        return None

    print(f"📄 Successfully mapped {len(raw_docs)} absolute text blocks/pages.")

    print("✂️ Splitting documents down into structured mathematical chunks...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=Config.CHUNK_SIZE, chunk_overlap=Config.CHUNK_OVERLAP)
    text_chunks = splitter.split_documents(raw_docs)
    print(f"🧩 Fragmented documents into {len(text_chunks)} distinct context nodes.")

    print("🚀 Computing vector transforms via all-MiniLM-L6-v2 and building Chroma Index...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return Chroma.from_documents(documents=text_chunks, embedding=embeddings, persist_directory=Config.DB_DIR)

def main():
    print("\n" + "="*50)
    print("       🌊 TextStream - NotebookLM Engine 🌊       ")
    print("="*50 + "\n")
    
    llm = initialize_llm()
    print(f"🤖 Connected Inference Node: {Config.DEFAULT_LLM_PROVIDER.upper()} -> {Config.GROQ_MODEL if Config.DEFAULT_LLM_PROVIDER == 'groq' else Config.GEMINI_MODEL}")
    
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    if os.path.exists(Config.DB_DIR) and len(os.listdir(Config.DB_DIR)) > 0:
        print("💾 Vector database snapshot identified. Initializing vector tracking maps...")
        vector_store = Chroma(persist_directory=Config.DB_DIR, embedding_function=embeddings)
    else:
        vector_store = build_vector_store()
        if not vector_store:
            return

    retriever = vector_store.as_retriever(search_kwargs={"k": Config.TOP_K_RESULTS})
    
    prompt_blueprint = (
        "You are a specialized document validation assistant. Synthesize your answer using ONLY the explicit data nodes provided below. "
        "If the answer cannot be confidently deduced from the payload context, state: 'I cannot verify that item based on your provided context documents.'\n\n"
        "Payload Context:\n{context}"
    )
    
    prompt = ChatPromptTemplate.from_messages([("system", prompt_blueprint), ("human", "{input}")])
    qa_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, qa_chain)
    
    print("\n✨ Ready to synthesize queries. Type 'exit' to disconnect session.\n")
    
    while True:
        query = input("❓ Question: ").strip()
        if query.lower() in ["exit", "quit"]:
            print("\n👋 Disconnecting TextStream framework. Session complete.")
            break
        if not query:
            continue
            
        print("🔍 Searching semantic index & formatting context inputs...")
        try:
            output = retrieval_chain.invoke({"input": query})
            print(f"\n✨ Synthesis Response: {output['answer']}\n")
            
            print("📚 Source Attributions:")
            seen = set()
            for idx, doc in enumerate(output.get("context", []), 1):
                path = doc.metadata.get("source", "System Fragment")
                page = doc.metadata.get("page", None)
                label = f"{path} (Page {page + 1})" if page is not None else path
                if label not in seen:
                    print(f"   {idx}. {label}")
                    seen.add(label)
            print("-" * 50 + "\n")
        except Exception as err:
            print(f"❌ Core processing execution error encountered: {err}\n")

if __name__ == "__main__":
    main()