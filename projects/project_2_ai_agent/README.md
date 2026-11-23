# Project 2: Enterprise Autonomous AI Software Development Team

An enterprise multi-agent software engineering team backend built with FastAPI, LangGraph Supervisor, and PostgreSQL (SQLModel + Psycopg).

---

## 🏗️ Architecture & Workflow

```text
User asks ──► Planner ──► Developer ──► Reviewer
                ▲              │
                └── fix it ◄───┘ (up to 3 tries)
                │
             APPROVED
                ▼
      Save ONE row in "runs" (PostgreSQL)
                ▼
      Send the row back to user / Download as .zip
```

### Agents & Tool Access Matrix
| Agent | `list_files` | `read_file` | `write_file` | Role |
| :--- | :---: | :---: | :---: | :--- |
| **Planner** | ✅ | ✅ | ❌ | Breaks down requirements and creates file architecture plan |
| **Developer** | ✅ | ✅ | ✅ | Implements files into the virtual in-memory filesystem |
| **Reviewer** | ✅ | ✅ | ❌ | Inspects code quality, requests fixes or replies `APPROVED` |

---

## 📁 Project Structure

```text
projects/project_2_ai_agent/
├── core/
│   ├── settings.py           # Pydantic configuration & env loading
│   └── database/
│       └── postgres.py       # SQLModel Run table and engine()
├── modules/
│   └── ai_agent/
│       ├── tools.py          # Virtual filesystem: list_files, read_file, write_file
│       ├── graph.py          # build_team(): supervisor + planner + developer + reviewer
│       ├── service.py        # Brain: chat(), summarize(), to_response(), download_run()
│       └── router.py         # Endpoints: /ai/runs/chat, /ai/runs/{id}, /ai/runs/{id}/download
├── .env.example              # Environment variables template
├── main.py                   # FastAPI application with X-API-KEY header security
├── pyproject.toml            # Project dependencies
└── README.md
```

---

## 🚀 Setup & Installation

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set:
```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/yourdbname
OPENAI_API_KEY=your_key_here
```

### 2. Install Dependencies
```bash
uv sync
```

### 3. Run Server
```bash
uv run python main.py
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 📡 API Endpoints

- `POST /ai/runs/chat`: Run multi-agent team to generate project files.
- `GET /ai/runs/{run_id}`: Fetch saved run details and generated files.
- `GET /ai/runs/{run_id}/download`: Download generated project code as a `.zip` file.
