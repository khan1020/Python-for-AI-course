"""Virtual in-memory filesystem tools for AI agents.

These tools operate on a shared dictionary in config['configurable']['files']
rather than touching the physical host disk.
"""
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig


@tool
def list_files(config: RunnableConfig) -> list[str]:
    """List the paths of all files in the current virtual project directory."""
    files = config.get("configurable", {}).get("files", {})
    return list(files.keys())


@tool
def read_file(path: str, config: RunnableConfig) -> str:
    """Read the content of a file from the project given its path."""
    files = config.get("configurable", {}).get("files", {})
    if path not in files:
        return f"Error: File '{path}' not found."
    return files[path]


@tool
def write_file(path: str, content: str, config: RunnableConfig) -> str:
    """Write or overwrite the content of a file in the project.

    Args:
        path: Relative file path (e.g. 'main.py', 'src/utils.py').
        content: The complete text content of the file.
    """
    files = config.get("configurable", {}).get("files", {})
    files[path] = content
    return f"Successfully wrote {len(content)} characters to '{path}'."


# Tool groupings by role permissions:
PLANNER_TOOLS = [list_files, read_file]
DEVELOPER_TOOLS = [list_files, read_file, write_file]
REVIEWER_TOOLS = [list_files, read_file]
