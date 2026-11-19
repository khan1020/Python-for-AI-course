from fastapi import APIRouter, Query
from .schema import chat_payload
from . import service

ai_agent_router = APIRouter(prefix="/ai")

@ai_agent_router.post("/chat")
def initiate_chat(payload: chat_payload):
    answer = service.chat(payload.query, payload.session_id)
    return {"session_id": payload.session_id, "answer": answer}

@ai_agent_router.get("/history", summary="Get a conversation's saved messages")
def get_history(session_id: str = Query(..., min_length=1)):
    return {"session_id": session_id, "messages": service.get_history(session_id)}

@ai_agent_router.delete("/history")
def delete_history(session_id: str = Query(..., min_length=1)):
    deleted = service.delete_history(session_id)
    return {"session_id": session_id, "deleted": deleted}
