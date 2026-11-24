# import libs / pkgs
from fastapi import FastAPI
from dotenv import load_dotenv

# import database
from core.database.postgres import engine

# import routes
from modules.ai_team.router import ai_agent_router

# load DB
load_dotenv()
engine()


app = FastAPI()


app.include_router(ai_agent_router, tags=["Dev Team"])