from langchain_mcp_adapter.client import MultiServerClient # type:ignore

servers = {
    "context7": {
        "transport" : "stdio",
        "command" : "npx",
        "args" :["-y","@upstash/context7-mcp"]
    }
}

async def load_mcp_tools(server=None):
    return await MultiServerClient(servers or SERVERS).get_tools() 
