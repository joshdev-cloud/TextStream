"""Quick diagnostic script to inspect ChromaDB contents."""
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

emb = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vs = Chroma(persist_directory="chroma_db", embedding_function=emb)
results = vs.get()

ids = results["ids"]
metas = results["metadatas"]
docs = results["documents"]

sources = set(m.get("source", "?") for m in metas)
print(f"Total chunks: {len(ids)}")
print(f"Sources: {sources}")
print()


# Show first 3 chunks"+{-
for i in range(min(3, len(ids))):
    print(f"--- Chunk {i} ---")
    print(f"  Source: {metas[i].get('source')}")
    print(f"  Page: {metas[i].get('page')}")
    print(f"  Text (first 200 chars): {docs[i][:200]}")
    print()

# Test retrieval
print("=== Testing retrieval for 'Oral Defense Grading' ===")
retriever = vs.as_retriever(search_kwargs={"k": 3})
found = retriever.invoke("What is this PDF about? Oral defense grading Agri3d")
for i, doc in enumerate(found):
    print(f"\n--- Result {i} ---")
    print(f"  Source: {doc.metadata.get('source')}")
    print(f"  Page: {doc.metadata.get('page')}")
    print(f"  Text: {doc.page_content[:300]}")

# Test with filter
print("\n=== Testing filtered retrieval (Oral-Defense-Grading-Agri3d.pdf) ===")
filtered = vs.as_retriever(
    search_kwargs={"k": 3, "filter": {"source": {"$in": ["Oral-Defense-Grading-Agri3d.pdf"]}}}
)
found2 = filtered.invoke("What is this document about?")
for i, doc in enumerate(found2):
    print(f"\n--- Result {i} ---")
    print(f"  Source: {doc.metadata.get('source')}")
    print(f"  Page: {doc.metadata.get('page')}")
    print(f"  Text: {doc.page_content[:300]}")


"backend tests"