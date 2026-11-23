import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Enterprise AI Agent API",
    description="Multi-agent orchestrator powered by LangGraph Supervisor",
    version="0.1.0",
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "enterprise-ai-agent"}

@app.get("/info")
def get_info():
    return {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o"),
        "status": "ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
