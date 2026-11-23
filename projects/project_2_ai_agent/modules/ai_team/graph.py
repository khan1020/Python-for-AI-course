import os

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor

def create_chat_model():
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        base_url=os.getenv("OPENAI_API_BASE_URL") or None,
        temperature=0,
        max_retries=6,
    )

def build_team():
    """Build and return the multi-agent supervisor team graph."""
    pass
