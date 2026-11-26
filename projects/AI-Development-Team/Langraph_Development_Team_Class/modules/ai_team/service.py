import io
import logging
import zipfile


from fastapi import HTTPException
from sqlmodel import Session


from core.database.postgres import Run, engine
from core.mcp import load_mcp_tools
from modules.ai_team.graph import build_team
from langfuse.langchain import CallbackHandler # type: ignore

_team = None
log = logging.getLogger(__name__)




async def get_team():
   global _team   # built on the first request, so the server can start without a model key
   if _team is None:
       try:
           docs_tools = await load_mcp_tools()
       except : 
           log.warning("\n*** Unable to load tools...***\n")
           docs_tools = []
       _team = build_team(docs_tools=docs_tools)
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




def prepare(message, parent_id=None):
   messages, files = [], {}
   if parent_id:
       with Session(engine()) as session:
           parent = session.get(Run, parent_id)
           if parent is None:
               raise HTTPException(404, "Parent run not found.")
           files = dict(parent.files)   # a copy: the parent's snapshot never changes
           messages = [("user", parent.message), ("assistant", parent.answer)]

   messages.append(("user", message))
   handler = CallbackHandler()
   config = {
        "configurable": {"files": files},
        "recursion_limit": 60,
        "callbacks": [handler],
        "run_name": "ai-development-team"
   }
   return messages, files, config, handler




def save(message, parent_id, files, result):
   with Session(engine()) as session:
       run = Run(parent_id=parent_id, message=message,
                 answer=result["messages"][-1].content, files=files,
                 **summarize(result["messages"]))
       session.add(run)
       session.commit()
       session.refresh(run)
       return to_response(run)




def chat(message, parent_id=None):
   messages, files, config, handler = prepare(message, parent_id)
   try:
       result = get_team().invoke({"messages": messages}, config)   # no session open during the slow AI call
       return save(message, parent_id, files, result)
   finally:
       try:
           handler._langfuse_client.flush()
       except Exception:
           pass




def progress(ns, task):
   # one LangGraph "tasks" event -> the progress events the browser shows
   started = "input" in task
   if not ns:   # top-level graph: the query moving between supervisor and agents
       event = {"type": "agent", "name": task["name"], "status": "start" if started else "done"}
       if task["name"] == "reviewer" and not started:
           _, review = last_answer((task.get("result") or {}).get("messages", []), "reviewer")
           if review:
               event["approved"] = review.lstrip("*#_ ").upper().startswith("APPROVED")
       return [event]
   agent = ns[0].split(":")[0]
   if started and task["name"] == "tools" and agent != "supervisor":
       calls = task["input"]
       calls = calls if isinstance(calls, list) else [calls["tool_call"]]
       return [{"type": "tool", "agent": agent, "name": c["name"], "path": c["args"].get("path")}
               for c in calls]
   return []




def chat_stream(message, parent_id=None):
   # runs before the response starts, so a missing parent is still a real 404
   messages, files, config, handler = prepare(message, parent_id)

   def events():
       try:
           result = None
           for ns, mode, data in get_team().stream(
                   {"messages": messages}, config,
                   stream_mode=["tasks", "values"], subgraphs=True):
               if mode == "tasks":
                   yield from progress(ns, data)
               elif not ns:
                   result = data   # final top-level state
           yield {"type": "done", "run": save(message, parent_id, files, result)}
       except Exception:   # the 200 status is already sent, so report failure as an event
           log.exception("Streaming run failed")
           yield {"type": "error", "error": "The team couldn\u2019t finish this run. Check the FastAPI logs."}
       finally:
           try:
               handler._langfuse_client.flush()
           except Exception:
               pass

   return events()




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



