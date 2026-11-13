from fastapi import FastAPI

from modules.ai_agent.router import ai_agent_router

app = FastAPI()

app.include_router(
    ai_agent_router,
    tags=["AI Agent"]
)

@app.get("/", status_code=200)
async def root():
    return {
        "message": 
        "Hello World"
        }


@app.post("/history", status_code=200)
async def get_history(session_id: str):
    
    return {
        "session_id": session_id,
        "history": f"Chat history for session {session_id}"
    }
        