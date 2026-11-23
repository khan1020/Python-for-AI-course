"""Main FastAPI entrypoint for Project 2 Enterprise AI Agent Backend."""
from fastapi import FastAPI, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader

from modules.ai_agent.router import ai_agent_router

# Setup API Key authentication header
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

app = FastAPI(
    title="Project 2: Enterprise AI Multi-Agent Backend",
    description="Autonomous software development team with Supervisor, Planner, Developer, Reviewer and PostgreSQL memory",
    version="0.1.0",
    dependencies=[Security(api_key_header)],
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(ai_agent_router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Project 2 Enterprise AI Agent Backend",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
