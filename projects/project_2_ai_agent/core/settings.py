import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/ai_agent_db"
    )
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    openai_api_base_url: str | None = os.getenv("OPENAI_API_BASE_URL", None)
    x_api_key: str = os.getenv("X_API_KEY", "secret-api-key")

settings = Settings()
