"""Router endpoints for AI agent runs, chatting, and zip downloads."""
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Response
from modules.ai_agent import service

ai_agent_router = APIRouter(prefix="/ai", tags=["AI Agent Runs"])


class ChatRequest(BaseModel):
    message: str = Field(..., description="Prompt or requirements for the software team")
    parent_id: Optional[UUID] = Field(default=None, description="Optional parent run UUID to iterate upon")


@ai_agent_router.post("/runs/chat")
def chat_endpoint(payload: ChatRequest):
    """Run the multi-agent software engineering team to plan, write, and review code."""
    return service.chat(message=payload.message, parent_id=payload.parent_id)


@ai_agent_router.get("/runs/{run_id}")
def get_run_endpoint(run_id: UUID):
    """Fetch details and files of a saved run by its UUID."""
    return service.get_run(run_id)


@ai_agent_router.get("/runs/{run_id}/download")
def download_run_endpoint(run_id: UUID):
    """Download all files generated during this run as a compressed zip archive."""
    return Response(
        content=service.download_run(run_id),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="run-{run_id}.zip"'},
    )
