"""service.py: the "brain" between the API routes and the database.

Flow of one request:
router.py -> chat() -> AI team works -> save a row in "runs" -> return it

Functions in this file:
- get_team(): builds the AI team once and reuses it
- last_answer(): finds one agent's last real reply in the conversation
- summarize(): turns the conversation into plan / review / approved / attempts
- to_response(): turns a database row into the JSON the API sends back
- chat(): the main job: load the parent run, run the team, save the result
- get_run(): look up one saved run by its id
- download_run(): packaging the generated files into an in-memory zip archive
"""
import io
import zipfile
from fastapi import HTTPException  # sends an error response, e.g. 404 Not Found
from sqlmodel import Session       # one "conversation" with the database
from core.database.postgres import Run, engine  # Run = the runs table, engine = the connection
from modules.ai_agent.graph import build_team   # builds the supervisor + planner/developer/reviewer

# ---------------------------------------------------------------------------
# get_team(): build the AI team only once
# ---------------------------------------------------------------------------
_team = None  # starts empty; the "_" means "private to this file"


def get_team():
    """Build the AI team only once and reuse it across requests."""
    global _team
    # Building the team creates the AI model, which needs the API key.
    # We wait until the FIRST request to build it, so:
    # 1. the server can start even if the key is missing (useful for tests and /docs)
    # 2. we don't rebuild the team on every request (that would be slow)
    if _team is None:
        _team = build_team()
    return _team


# ---------------------------------------------------------------------------
# last_answer(): find an agent's last REAL reply
# ---------------------------------------------------------------------------
def last_answer(messages, name):
    """Find one agent's last real reply in the conversation.

    Counts backwards through the positions to find the latest non-tool reply.
    """
    for i in range(len(messages) - 1, -1, -1):
        m = messages[i]
        # A "real reply" must pass all four checks:
        # m.type == "ai" written by an AI, not the user or a tool result
        # getattr(m, "name", None) == name: written by the requested agent
        # m.content has text (not empty)
        # not m.tool_calls: is not just a tool request
        sender = getattr(m, "name", None)
        if getattr(m, "type", None) == "ai" and sender == name and m.content and not getattr(m, "tool_calls", None):
            return i, m.content
    return -1, ""


# ---------------------------------------------------------------------------
# summarize(): turn the whole conversation into 4 database columns
# ---------------------------------------------------------------------------
def summarize(messages):
    """Turn the conversation messages into plan, review, approved, and attempts."""
    # Where is the developer's last reply?
    dev_at, _ = last_answer(messages, "developer")
    # Where is the reviewer's last reply, and what did it say?
    review_at, review = last_answer(messages, "reviewer")
    # What was the plan?
    _, plan = last_answer(messages, "planner")

    # attempts = how many real replies the developer gave = how many times it wrote code
    attempts = sum(
        1 for m in messages
        if getattr(m, "type", None) == "ai"
        and getattr(m, "name", None) == "developer"
        and m.content
        and not getattr(m, "tool_calls", None)
    )

    # approved is True only if:
    # 1. review_at > dev_at (review came AFTER developer's last change)
    # 2. the review starts with "APPROVED"
    approved = review_at > dev_at and review.lstrip("*#_ ").upper().startswith("APPROVED")

    return {
        "plan": plan,
        "review": review,
        "approved": approved,
        "attempts": attempts,
    }


# ---------------------------------------------------------------------------
# to_response(): turn a database row into the API's JSON answer
# ---------------------------------------------------------------------------
def to_response(run: Run):
    """Format a Run row into clean JSON dictionary response."""
    return {
        "id": run.id,
        "parent_id": run.parent_id,
        "message": run.message,
        "created_at": run.created_at,
        "result": {
            k: getattr(run, k)
            for k in ["answer", "plan", "files", "review", "approved", "attempts"]
        },
    }


# ---------------------------------------------------------------------------
# chat(): the main job, called by POST /runs/chat
# ---------------------------------------------------------------------------
def chat(message: str, parent_id=None):
    """Execute multi-agent development workflow and store result in PostgreSQL."""
    # Start with no conversation and no files: a brand-new project.
    messages, files = [], {}

    # STEP 1: If this request improves an earlier run, load that run first.
    if parent_id:
        with Session(engine()) as session:
            parent = session.get(Run, parent_id)
            if parent is None:
                raise HTTPException(404, "Parent run not found.")
            # dict(...) makes an isolated copy so previous run is never modified
            files = dict(parent.files)
            # Give short context to the team
            messages = [
                ("user", parent.message),
                ("assistant", parent.answer),
            ]

    # Add the new user request
    messages.append(("user", message))

    # STEP 2: Run the AI team.
    # "configurable": {"files": files} -> passed to list/read/write tools in RAM
    config = {"configurable": {"files": files}, "recursion_limit": 60}
    result = get_team().invoke({"messages": messages}, config)

    # STEP 3: Save the result as ONE new row.
    with Session(engine()) as session:
        run = Run(
            parent_id=parent_id,
            message=message,
            answer=result["messages"][-1].content,
            files=files,
            **summarize(result["messages"]),
        )
        session.add(run)
        session.commit()
        session.refresh(run)
        return to_response(run)


# ---------------------------------------------------------------------------
# get_run(): called by GET /runs/{run_id}
# ---------------------------------------------------------------------------
def get_run(run_id):
    """Retrieve one saved run by its UUID."""
    with Session(engine()) as session:
        run = session.get(Run, run_id)
        if run is None:
            raise HTTPException(404, "Run not found.")
        return to_response(run)


# ---------------------------------------------------------------------------
# download_run(): called by GET /runs/{run_id}/download
# ---------------------------------------------------------------------------
def download_run(run_id):
    """Build an in-memory zip of all files produced in this run and return bytes."""
    with Session(engine()) as session:
        run = session.get(Run, run_id)
        if run is None:
            raise HTTPException(404, "Run not found.")
        files = run.files
        buffer = io.BytesIO()  # builds the zip in memory, not on disk
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
            for path, content in files.items():
                z.writestr(path, content)  # one entry per file: "calc.py" -> its code
        return buffer.getvalue()
