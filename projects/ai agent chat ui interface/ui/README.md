# Agent chat UI

A Next.js chat interface for the existing FastAPI and LangGraph agent.

## Run the UI

1. In the backend folder, copy `.env.example` to `.env`; set `OPENROUTER_API_KEY`, keep `LLM_PROVIDER=openrouter`, and use `CHAT_MODEL=openrouter/free` (OpenRouter's free-model quota may require account credits).
2. Copy `.env.local.example` to `.env.local`.
3. Set `BACKEND_API_URL` to the address of the FastAPI server (the default local value is `http://localhost:8000`).
4. Install packages with `npm install` if needed, then run `npm run dev`.
5. Open `http://localhost:3000`.

The UI proxies requests through Next.js to `POST /ai/chat` and `GET /ai/history`. Start the backend separately from `notebooks/Week 8/Day 39/enterprise_ai_agent` with `uv sync` and `uv run fastapi dev`.

Conversation IDs and the sidebar list are stored in this browser. Each saved session loads its messages from the backend history endpoint when opened. The backend does not expose an endpoint for listing every session, so the UI cannot discover conversations from another browser or a cleared local store.

## Main files

- `app/chat.tsx` — chat UI, local session list, composer, and markdown rendering.
- `app/api/chat/route.ts` and `app/api/history/route.ts` — same-origin API proxy routes.
- `lib/api.ts` and `lib/backend.ts` — typed frontend API service and backend forwarding.
- `.env.local.example` — backend URL configuration.
