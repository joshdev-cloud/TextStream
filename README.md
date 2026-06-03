# 🌊 TextStream // The Ultimate Interactive Study Companion

TextStream is a high-fidelity, localized RAG (Retrieval-Augmented Generation) ecosystem engineered specifically for students, researchers, and technical professionals. It transforms private text documents and academic PDFs into an active, responsive learning environment. 

Moving completely away from standard static chat blocks, TextStream utilizes a vibrant, friendly glassmorphic split-panel architecture. It couples deep semantic vector search with real-time context-scoping, automated high-density summaries, and multi-mode custom evaluation engines to maximize knowledge retention while entirely eliminating information hallucinations.

---

## ✨ Core Architecture & Advanced Features

* **Context-Scoped Document Toggling:** Take complete control over your RAG workspace geometry. Activating or deactivating file nodes in the UI ribbon tells the backend to execute strict metadata filtering in the database. The AI ignores inactive files completely, grounding its focus exactly on selected files.
* **Parametric Gamified Quiz Suite:** Instantly generate production-grade multiple choice evaluations directly from your active reading materials. Customize the item count (5, 10, or 20 questions) and the difficulty tracking matrix (Easy, Medium, or Hard).
* **Specialized Quiz Dynamics:** Focus your study sessions using four unique operational test modes:
  * *Sprint Mode:* High-pressure training with an active 20-second countdown timer per item.
  * *Marathon Mode:* Full-length diagnostic assessments exploring every section across your active documents.
  * *Blitz Mode:* Continuous rapid-fire loops that advance automatically the moment you choose an answer.
  * *Sudden Death Survival:* High-stakes testing where the entire evaluation loop terminates on your first incorrect answer.
* **Automated High-Density Summarization:** Bypass standard chat prompting entirely. A dedicated summarization engine extracts text fragments from your active documents and organizes core methodologies, key technical terms, and critical takeaways into structured analytical bullet points.
* **Glassmorphic UI with Interaction Overlays:** Built with an eye-catching Midnight Slate, Warm Cream, Sunflower Amber, and Electric Lavender palette. Includes full hover-state citation peek previews that slide open floating text fragments from the source page numbers without breaking your workflow.
* **Workspace Project Hub:** Organize individual classes, semesters, or research topics into distinct sandboxes. The home dashboard allows users to initialize, review, track, and rename historical conversation tracks seamlessly.
* **Dual-Engine Processing Core:** Supports rapid-fire inference loops through local architectures and ultra-low latency Groq configurations, paired with heavy-duty analytical reasoning capabilities via Google Gemini.

---

## 🛠️ Project Directory Structure

```text
TextStream/
├── backend/               # FastAPI Production Core Engine
│   ├── chroma_db/         # Local vector database storage (Auto-generated)
│   ├── documents/         # Ingestion directory for target PDFs and TXT files
│   ├── .env               # Private API credentials (Excluded from version control)
│   ├── config.py          # LLM weights, chunk sizes, and system configurations
│   ├── main.py            # Ingestion pipelines, metadata filters, and REST endpoints
│   └── requirements.txt   # Backend application dependencies
│
├── frontend/              # User Interface Workspace (Vite + React Canvas)
├── .gitignore             # Global version control exclusion maps
└── README.md              # Repository documentation
