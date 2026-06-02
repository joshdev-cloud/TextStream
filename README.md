# 🌊 TextStream

TextStream is a localized, personalized RAG (Retrieval-Augmented Generation) chatbot designed to parse, index, and extract insights from your private documents. By utilizing advanced contextual retrieval pipelines, it serves as an intelligent research companion that ensures responses are strictly grounded in your provided files, minimizing hallucinations while tracking sources accurately.

## ✨ Core Architecture

* **Context-Grounded QA:** Synthesizes answers using only the documentation provided in your local data directory.
* **Dual-Engine Processing:** Supports high-speed inference through Groq (Llama 3) or heavy-duty reasoning via Google Gemini.
* **Localized Vector Database:** Computes text embeddings locally using Hugging Face transformers and indexes them within a local Chroma DB instance.
* **Transparent Source Tracking:** Maps every generated response back to its exact document origin and page number.

## 🛠️ Project Directory Structure

```text
TextStream/
│
├── documents/          # Drop your target PDFs and TXT files here
├── chroma_db/          # Local vector database storage (Auto-generated)
│
├── config.py           # System parameters, model selections, and chunk configurations
├── main.py             # Document ingestion pipeline and conversational RAG loop
├── requirements.txt    # Application dependencies
└── .env                # Private API credentials (Excludes from version control)
