
"""Agent tools. Files live in a per-run dict passed through config, then saved to PostgreSQL."""
import os
from pathlib import PurePosixPath

import httpx
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

MAX_FILES = 10
MAX_CHARS = 30_000


def run_files(config: RunnableConfig) -> dict:
   return config["configurable"]["files"]


@tool
def list_files(config: RunnableConfig) -> str:
   """List every file in this run."""
   return "\n".join(sorted(run_files(config))) or "No files yet."   # never [], providers reject empty tool results


@tool
def read_file(path: str, config: RunnableConfig) -> str:
   """Read the latest text of a file, e.g. calculator.py."""
   return run_files(config).get(path, "File not found.")


@tool
def write_file(path: str, content: str, config: RunnableConfig) -> str:
   """Create a file or replace its entire contents. Use a relative path."""
   files = run_files(config)
   p = PurePosixPath(path)
   if not path or p.is_absolute() or ".." in p.parts:
       return "Error: use a relative path like calculator.py."
   if len(content) > MAX_CHARS:
       return f"Error: files must be under {MAX_CHARS} characters."
   if path not in files and len(files) >= MAX_FILES:
       return f"Error: a run supports {MAX_FILES} files."
   files[path] = content
   return f"Saved {path} ({len(content)} characters)."


@tool
def web_search(query: str) -> str:
   """Search the web for library documentation. Returns up to three URLs with excerpts."""
   response = httpx.post("https://api.tavily.com/search", timeout=30, json={
       "api_key": os.environ["TAVILY_API_KEY"], "query": query, "max_results": 3})
   if response.status_code != 200:
       return f"Search failed ({response.status_code})."
   results = response.json().get("results", [])
   return "\n\n".join(f"{r['url']}\n{r['content'][:500]}" for r in results) or "No results."



