from fastapi import FastAPI, Request
from core.database.sqlite import init_database

# Middlewares
from fastapi.middleware.cors import CORSMiddleware
from middlewares.authenticate import api_authenticate_key
from dotenv import load_dotenv


# Load environments
load_dotenv()

# Import Routers
from modules.ai_agent.router import ai_agent_router

init_database()   # create tables once when the server starts
app = FastAPI()

origins = [
   "http://localhost:5500",
#    "https://platform.ecochamp.app",
#    "https://ecochamp.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)

@app.get("/", status_code=200)
async def root():
    return {
        "message":  "Your at the Xander's Backend"
    }

app.middleware("http")(api_authenticate_key)
app.include_router(
    ai_agent_router,
    tags=["AI Module"]
)


