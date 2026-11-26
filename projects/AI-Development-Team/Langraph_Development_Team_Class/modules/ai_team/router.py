from uuid import UUID
import json
from fastapi import APIRouter, Response

from modules.ai_team import service
from modules.ai_team.schema import ChatRequest
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
ai_agent_router = APIRouter(prefix="/api/team")


@ai_agent_router.post("/chat")
def chat(payload: ChatRequest):
    return service.chat(payload.message, payload.parent_id)

@ai_agent_router.post("/chat/stream")
def chat_stream(payload: ChatRequest):
    events = service.chat_stream(payload.message, payload.parent_id)
    return StreamingResponse(
        (f"data: {json.dumps(jsonable_encoder(e))}\n\n" for e in events),
        media_type="text/event-stream",
    )

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
