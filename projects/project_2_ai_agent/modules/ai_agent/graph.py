"""Supervisor graph building the multi-agent software development team:
Planner -> Developer -> Reviewer (up to 3 tries) -> APPROVED -> Supervisor summary.
"""
import os
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

from modules.ai_agent.tools import (
    PLANNER_TOOLS,
    DEVELOPER_TOOLS,
    REVIEWER_TOOLS,
)


def create_chat_model():
    """Create chat model instance using environment configuration."""
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
    base_url = os.getenv("OPENAI_API_BASE_URL") or None
    api_key = os.getenv("OPENAI_API_KEY", "")

    return ChatOpenAI(
        model=model_name,
        base_url=base_url,
        api_key=api_key or "placeholder-key",
        temperature=0,
        max_retries=3,
    )


def build_team():
    """Build and compile the multi-agent software engineering team."""
    model = create_chat_model()

    planner = create_react_agent(
        model=model,
        tools=PLANNER_TOOLS,
        name="planner",
        prompt=(
            "You are an expert Software Architect and Planner. "
            "Analyze user requirements, inspect existing files using list_files and read_file, "
            "and produce a clean, step-by-step implementation plan. "
            "Do NOT write implementation files yourself; only plan the file names, functions, and architecture."
        ),
    )

    developer = create_react_agent(
        model=model,
        tools=DEVELOPER_TOOLS,
        name="developer",
        prompt=(
            "You are a Senior Full-Stack Software Developer. "
            "Follow the architecture provided by the planner or fix feedback from the reviewer. "
            "Write complete, working code into the virtual project using the write_file tool. "
            "Inspect existing files when needed with list_files and read_file. "
            "Always implement clean, production-ready code with no placeholder comments."
        ),
    )

    reviewer = create_react_agent(
        model=model,
        tools=REVIEWER_TOOLS,
        name="reviewer",
        prompt=(
            "You are a Lead Code Reviewer and QA Engineer. "
            "Inspect all generated files with list_files and read_file. "
            "Verify code correctness, edge cases, error handling, and requirements satisfaction. "
            "If issues exist, provide clear bullet points for the developer to fix. "
            "If the implementation meets all requirements and is bug-free, start your reply with the exact word 'APPROVED'."
        ),
    )

    supervisor = create_supervisor(
        agents=[planner, developer, reviewer],
        model=model,
        prompt=(
            "You are the Engineering Director managing a software development team: "
            "planner, developer, and reviewer.\n\n"
            "Workflow:\n"
            "1. Route first to planner to design the architecture and files.\n"
            "2. Route to developer to implement and write the files.\n"
            "3. Route to reviewer to inspect the files.\n"
            "4. If reviewer requests fixes, route back to developer (up to 3 review loops).\n"
            "5. Once reviewer approves (starts with APPROVED) or max attempts reached, provide a final concise summary to the user."
        ),
    )

    return supervisor.compile()
