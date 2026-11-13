from fastapi import APIRouter
from .schema import chat_payload

ai_agent_router = APIRouter(prefix= "/ai")
@ai_agent_router.post("/chat")
def initilize_chat(query: chat_payload):
    print(query.model_dump())
    return query

@ai_agent_router.post("/history")
def get_history(session_id: str):
    print(f"Session ID has been recieved: {session_id}")
    return f"here is chat for {session_id}: session_id"
