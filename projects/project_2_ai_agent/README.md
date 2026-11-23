# Project 2: Enterprise AI Agent

An enterprise-ready AI multi-agent system built using LangChain, LangGraph Supervisor, and FastAPI.

## Architecture

- **Supervisor Agent**: Orchestrates task routing, decomposition, and coordination between specialized sub-agents.
- **Knowledge Base Module**: Handles document indexing, vector store retrieval, and domain context enrichment.
- **AI Team**: Defines team graph topologies and agent tools.

## Setup & Running

```bash
# Install dependencies with uv
uv sync

# Run the agent application
uv run python main.py
```
