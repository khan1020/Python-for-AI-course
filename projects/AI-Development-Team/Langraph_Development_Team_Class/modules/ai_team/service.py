import io
import zipfile

from fastapi import HTTPException
from sqlmodel import Session

from core.database.postgres import Run, engine
from modules.ai_agent.graph import build_team

_team = None


def get_team():
    global _team   # built on the first request, so the server can start without a model key
    if _team is None:
        _team = build_team()
    return _team


def last_answer(messages, name):
    # position and text of a worker's last real reply (not a tool call)
    for i in range(len(messages) - 1, -1, -1): # explain it: 
        m = messages[i]
        if m.type == "ai" and m.name == name and m.content and not m.tool_calls:
            return i, m.content
    return -1, ""


def summarize(messages):
    dev_at, _ = last_answer(messages, "developer")
    review_at, review = last_answer(messages, "reviewer")
    _, plan = last_answer(messages, "planner")
    attempts = sum(1 for m in messages if m.type == "ai" and m.name == "developer"
                   and m.content and not m.tool_calls)
    # approval only counts if the developer didn't change anything after the review
    approved = review_at > dev_at and review.lstrip("*#_ ").upper().startswith("APPROVED")
    return {
        "plan": plan, 
        "review": review, 
        "approved": approved, 
        "attempts": attempts
    }


def to_response(run):
    return {
        "id": run.id, "parent_id": run.parent_id, "message": run.message,
        "created_at": run.created_at,
        "result": {k: getattr(run, k) for k in ["answer", "plan", "files", "review", "approved", "attempts"]},
    }


def chat(message, parent_id=None):
    messages, files = [], {}
    if parent_id:
        with Session(engine()) as session:
            parent = session.get(Run, parent_id)
            if parent is None:
                raise HTTPException(404, "Parent run not found.")
            files = dict(parent.files)   # a copy: the parent's snapshot never changes
            messages = [("user", parent.message), ("assistant", parent.answer)]
    messages.append(("user", message))

    config = {"configurable": {"files": files}, "recursion_limit": 60}
    result = get_team().invoke({"messages": messages}, config)   # no session open during the slow AI call

    with Session(engine()) as session:
        run = Run(parent_id=parent_id, message=message,
                  answer=result["messages"][-1].content, files=files,
                  **summarize(result["messages"]))
        session.add(run)
        session.commit()
        session.refresh(run)
        return to_response(run)


def get_run(run_id):
    with Session(engine()) as session:
        run = session.get(Run, run_id)
        if run is None:
            raise HTTPException(404, "Run not found.")
        return to_response(run)


def download_run(run_id):
    with Session(engine()) as session:
        run = session.get(Run, run_id)
        if run is None:
            raise HTTPException(404, "Run not found.")
        files = run.files

    buffer = io.BytesIO()   # build the zip in memory, not on disk
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
        for path, content in files.items():   # write_file already blocks "../" paths
            z.writestr(path, content)
    return buffer.getvalue()
