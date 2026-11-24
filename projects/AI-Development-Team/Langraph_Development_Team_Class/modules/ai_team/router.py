from uuid import UUID

from fastapi import APIRouter, Response

from modules.ai_team import service
from modules.ai_team.schema import ChatRequest

ai_agent_router = APIRouter(prefix="/api/team")


@ai_agent_router.post("/chat")
def chat(payload: ChatRequest):
    return service.chat(payload.message, payload.parent_id)


@ai_agent_router.get("/runs/{run_id}")
def get_run(run_id: UUID):
    return service.get_run(run_id)


@ai_agent_router.get("/runs/{run_id}/download")
def download_run(run_id: UUID):
    return Response(
        service.download_run(run_id),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="run-{run_id}.zip"'},
    )
