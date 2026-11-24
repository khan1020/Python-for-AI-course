"""LangGraph agent: assistant node <-> tools node, with a choice of LLM."""
import os
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from core import settings  # noqa: F401  (loads .env)
from modules.ai_agent.tools import TOOLS

SYSTEM_PROMPT = """You are the friendly customer support assistant for Xander Restaurant.
Keep replies short. Prices are in Pakistani rupees. Use fetch_menu for menu/prices.
For complaints, collect customer name, phone, complaint and order ID. Validate the
order ID with validate_order_id, then call log_complaint only for a valid order.
Never invent facts. Ask for missing details.
"""

# ponytail: both speak the OpenAI API, so one ChatOpenAI class covers both
LLMS = {
    "ollama": dict(
        base_url="http://localhost:11434/v1",
        api_key="ollama",
        model=os.getenv("OLLAMA_MODEL", "qwen3:4b")),
    "groq": dict(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY"),
        model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")),
    "openrouter": dict(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model=os.getenv("CHAT_MODEL", "openrouter/free")),
}


def create_chat_model(llm="ollama"):
    return ChatOpenAI(**LLMS[llm], temperature=0, extra_body={"max_tokens": 2048})


def build_graph(llm="ollama", model=None, tools=None):
    # model= lets tests pass a fake model instead of a real LLM
    tools = TOOLS if tools is None else tools
    model = create_chat_model(llm) if model is None else model
    model_with_tools = model.bind_tools(tools)

    # Node 1: the LLM reads all messages and replies (text, or a tool call)
    def assistant(state: MessagesState):
        reply = model_with_tools.invoke(
            [SystemMessage(content=SYSTEM_PROMPT), *state["messages"]])
        return {"messages": [reply]}

    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    # Node 2: runs the tool the LLM asked for
    builder.add_node("tools", ToolNode(tools))
    builder.add_edge(START, "assistant")                   # start -> assistant
    # tool call? -> tools, else -> END
    builder.add_conditional_edges("assistant", tools_condition)
    # tool result goes back to the LLM
    builder.add_edge("tools", "assistant")
    return builder.compile()


if __name__ == "__main__":
    import sys
    graph = build_graph(sys.argv[1] if len(sys.argv) > 1 else "ollama")
    out = graph.invoke({"messages": [("user", "What is on the menu?")]})
    print(out["messages"][-1].content)




"""AI Development Team: a supervisor delegates to planner, developer and reviewer agents."""
import os


from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor


from core import settings  # noqa: F401  (loads .env)
from modules.ai_agent.tools import list_files, read_file, web_search, write_file


MAX_DEVELOPER_PASSES = 3


# ponytail: both speak the OpenAI API, so one ChatOpenAI class covers both
LLMS = {
   "ollama": dict(
       base_url="http://localhost:11434/v1",
       api_key="ollama",
       model=os.getenv("OLLAMA_MODEL", "qwen3:4b")),
   "groq": dict(
       base_url="https://api.groq.com/openai/v1",
       api_key=os.getenv("GROQ_API_KEY"),
       model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")),
}




def create_chat_model(llm="groq"):
   # max_retries: free tiers hit tokens-per-minute limits; this waits them out
   return ChatOpenAI(**LLMS[llm], temperature=0, max_retries=6)




def build_team(model=None):
   model = model or create_chat_model()
   planner_tools = [list_files, read_file] + ([web_search] if os.getenv("TAVILY_API_KEY") else [])


   planner = create_agent(
       model, planner_tools, name="planner",
       system_prompt=("You are a Python planner. Read the request and any existing files. "
                      "Reply with short requirements, implementation steps and numbered "
                      "acceptance criteria. If you search the web, list source URLs. "
                      "Do not write code."),
   )
   developer = create_agent(
       model, [list_files, read_file, write_file], name="developer",
       system_prompt=("You are a Python developer. Implement the plan by saving complete files "
                      "with write_file. If the reviewer gave feedback, fix every point. "
                      "Reply with the files you changed. Never claim you ran the code."),
   )
   reviewer = create_agent(
       model, [list_files, read_file], name="reviewer",
       system_prompt=("You are a code reviewer. Read every file and check it against the "
                      "acceptance criteria and edge cases. Start your reply with exactly "
                      "APPROVED or CHANGES REQUESTED, then list specific fixes. "
                      "You cannot run code: never claim tests passed."),
   )


   return create_supervisor(
       agents=[planner, developer, reviewer],
       model=model,
       prompt=(
           "You manage a Python development team. You never write code yourself.\n"
           "1. New request -> planner.\n"
           "2. After a plan -> developer.\n"
           "3. After the developer saves files -> reviewer.\n"
           "4. CHANGES REQUESTED -> developer with the feedback.\n"
           f"5. Stop when APPROVED, or after {MAX_DEVELOPER_PASSES} developer passes.\n"
           "A revision request starts from the previous run's files: skip the planner if the change is small.\n"
           "Finish with a short summary: approved or draft, files changed, open feedback."
       ),
   ).compile()




if __name__ == "__main__":
   print(build_team().get_graph().draw_mermaid())   # show students the supervisor graph
    