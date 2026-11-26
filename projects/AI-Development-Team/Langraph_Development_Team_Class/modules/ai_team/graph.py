"""AI Development Team: a supervisor delegates to planner, developer and reviewer agents."""
import os


from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, MessagesState, StateGraph # type: ignore


from core import settings  # noqa: F401  (loads .env)
from modules.ai_team.tools import list_files, read_file, web_search, write_file


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
   "openrouter": dict(
       base_url="https://openrouter.ai/api/v1",
       api_key=os.getenv("OPENROUTER_API_KEY"),
       model=os.getenv("OPENROUTER_MODEL", "openrouter/free")),
}




def create_chat_model(llm=None):
   # max_retries: free tiers hit tokens-per-minute limits; this waits them out
   llm = llm or os.getenv("LLM_PROVIDER", "openrouter")
   return ChatOpenAI(
       **LLMS[llm],
       temperature=0,
       max_retries=6,
       max_tokens=int(os.getenv("MAX_OUTPUT_TOKENS", "4096")),
   )




def build_team(model=None, docs_tools=()):
   model = model or create_chat_model()
   planner_tools = [list_files, read_file,  *docs_tools] +  ([web_search] if os.getenv("TAVILY_API_KEY") else []) 


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
                       "with write_file. Keep each file small (split large modules) and make "
                       "one write_file call per file, one at a time. "
                       "If the reviewer gave feedback, fix every point. "
                       "Reply with the files you changed. Never claim you ran the code."),
   )
   reviewer = create_agent(
       model, [list_files, read_file], name="reviewer",
       system_prompt=("You are a code reviewer. Read every file and check it against the "
                      "acceptance criteria and edge cases. Start your reply with exactly "
                      "APPROVED or CHANGES REQUESTED, then list specific fixes. "
                      "You cannot run code: never claim tests passed."),
   )


   def run(agent, name):
       def node(state: MessagesState, config):
           before = len(state["messages"])
           result = agent.invoke({"messages": state["messages"]}, config)
           messages = result["messages"][before:]
           # The summary code identifies each worker by its AI-message name.
           messages = [
               message.model_copy(update={"name": name})
               if message.type == "ai" and not message.name else message
               for message in messages
           ]
           return {"messages": messages}
       return node

   workflow = StateGraph(MessagesState)
   workflow.add_node("planner", run(planner, "planner"))
   workflow.add_node("developer", run(developer, "developer"))
   workflow.add_node("reviewer", run(reviewer, "reviewer"))
   workflow.add_edge(START, "planner")
   workflow.add_edge("planner", "developer")
   workflow.add_edge("developer", "reviewer")
   workflow.add_edge("reviewer", END)
   return workflow.compile()




if __name__ == "__main__":
   print(build_team().get_graph().draw_mermaid())   # show students the supervisor graph



