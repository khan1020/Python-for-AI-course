# 🚀 Applied AI & RAG Master Notes (Day 23 – Day 33)

Welcome to your comprehensive master notes! These notes cover everything from **the inner mechanics of Large Language Models** to building a **full production-ready enterprise RAG (Retrieval-Augmented Generation) application**.

Every lesson is written assuming **zero prior knowledge**, with clear real-world analogies, step-by-step code line explanations, and practical architectural patterns.

---

## 🗺️ Curriculum Roadmap & Table of Contents

```
[ Phase 1: LLM Fundamentals ]
├── Lesson 1: Bridge to LLMs (Day 23)
│   └── 01_Bridge_to_LLMs.md
│       • Inside ChatGPT: tokens, token IDs, embeddings
│       • Attention mechanism from scratch (the heart of the Transformer)
│       • Softmax, scores to probabilities, next-token prediction loop
│
└── Lesson 2: LLM APIs & Efficient Prompting (Day 24)
    └── 02_LLM_APIs_and_Prompting.md
        • How to call remote AI models via OpenRouter & OpenAI client
        • Real 2,048-dimensional embeddings & Cosine Similarity
        • Zero-shot vs Few-shot prompting & System instructions
        • Multi-turn chat memory & context window management
        • Structured JSON output extraction with error tolerance

[ Phase 2: Document Ingestion & Vector Databases ]
├── Lesson 3: Document Loading & Chunking (Day 30)
│   └── 03_Document_Loading_and_Chunking.md
│       • Reading files with pathlib.Path
│       • Why chunk? (The "smoothie" vector-blurring problem)
│       • The 12 chunking strategies (Fixed, Sliding Window, Paragraph, Recursive, Semantic, Modality)
│       • How to pick the optimal chunking strategy for your project
│
└── Lesson 4: Building the Retrieval Pipeline — RAG v1 (Day 31)
    └── 04_Retrieval_Pipeline.md
        • The Open-Book Exam analogy (Retrieve ➔ Augment ➔ Generate)
        • ChromaDB persistent disk storage (`company_db`)
        • Cosine distance search in vector space
        • Decoupled embeddings vs generation
        • RAG troubleshooting matrix (Did search break or did the prompt break?)

[ Phase 3: Production Engineering & Capstone Project ]
├── Lesson 5: Improving RAG Quality & Enterprise Architecture (Day 32)
│   └── 05_Improving_RAG_Quality.md
│       • Strict grounding prompts & eliminating hallucinations
│       • Source file citations: `[leave_policy.txt]`
│       • Distance cutoff thresholds (rejecting off-topic queries)
│       • RAG vs Fine-tuning (The classic job interview answer)
│       • Role-Based Access Control (RBAC): filtering secrets in Chroma (`where`), not in prompts!
│       • Multi-layer Input Guardrails (Regex rules + LLM safety checks)
│
└── Lesson 6: The Full RAG Web Application & Checkpoint (Day 33)
    └── 06_RAG_Checkpoint_Project.md
        • Streamlit interactive chat user interface (`chai_wala_rag_app.py`)
        • Protecting sensitive PII (CNIC & phone masking / swap & restore)
        • Two-stage re-ranking (retrieve 6 candidates, promote best to rank 1)
        • Comprehensive 8-category QA testing suite
        • The 8 checkpoint exam questions and solutions
```

---

## 📂 Folder Directory

| Folder | File | Topic |
|---|---|---|
| [`Lesson_01_Bridge_to_LLMs/`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_01_Bridge_to_LLMs) | [`01_Bridge_to_LLMs.md`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_01_Bridge_to_LLMs/01_Bridge_to_LLMs.md) | Inside Transformers & Next-Word Prediction |
| [`Lesson_02_LLM_APIs_and_Prompting/`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_02_LLM_APIs_and_Prompting) | [`02_LLM_APIs_and_Prompting.md`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_02_LLM_APIs_and_Prompting/02_LLM_APIs_and_Prompting.md) | OpenRouter, Prompting, Tokens, JSON Output |
| [`Lesson_03_Document_Loading_and_Chunking/`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_03_Document_Loading_and_Chunking) | [`03_Document_Loading_and_Chunking.md`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_03_Document_Loading_and_Chunking/03_Document_Loading_and_Chunking.md) | Document Loading, 12 Chunking Strategies |
| [`Lesson_04_Retrieval_Pipeline/`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_04_Retrieval_Pipeline) | [`04_Retrieval_Pipeline.md`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_04_Retrieval_Pipeline/04_Retrieval_Pipeline.md) | ChromaDB Vector Store & RAG Pipeline v1 |
| [`Lesson_05_Improving_RAG_Quality/`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_05_Improving_RAG_Quality) | [`05_Improving_RAG_Quality.md`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_05_Improving_RAG_Quality/05_Improving_RAG_Quality.md) | Citations, Cutoffs, RBAC Security, Guardrails |
| [`Lesson_06_RAG_Checkpoint_Project/`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_06_RAG_Checkpoint_Project) | [`06_RAG_Checkpoint_Project.md`](file:///c:/Users/AfzalTAS/Desktop/Ashrei%20Tech/notes/Lesson_06_RAG_Checkpoint_Project/06_RAG_Checkpoint_Project.md) | Streamlit Web App, PII Masking, Re-Ranking |

---

## 💡 Quick Tips for Studying

1. **Read in order:** Each lesson is built intentionally to solve a specific limitation discovered in the lesson before it.
2. **Run the code:** Test the snippets inside your virtual environment (`.venv`).
3. **Launch the web app:** Once you finish Lesson 6, run `streamlit run "notebooks/Week 7/Day 33/chai_wala_rag_app.py"` to see your bot come to life!
