import os 

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor

def create_chat_model():
    return ChatOpenAI(
        model=os.environ["OPENAI_MODEL"],
        base_url=os.getenv("OPENAI_BASE_URL") or None,
        temperature=0,
        max_retries=6,   # free tiers hit tokens-per-minute limits; this waits them out
    )

def build_team(model=None):

    model = create_chat_model()

    planner = create_agent(
        name="Planner Sub-Agent",
        model=model,
        tools=[],
        system_prompt=""
    )

    reviewer = create_agent(
            name="Planner Sub-Agent",
            model=model,
            tools=[],
            system_prompt=""
        )

    developer = create_agent(
                name="Planner Sub-Agent",
                model=model,
                tools=[],
                system_prompt=""
            )

    compiler = create_agent(
                name="Planner Sub-Agent",
                model=model,
                tools=[],
                system_prompt=""
            )

