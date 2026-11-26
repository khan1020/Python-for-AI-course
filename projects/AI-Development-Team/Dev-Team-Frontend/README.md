# AI Development Team: frontend

A Next.js app for the AI Development Team backend (FastAPI + LangGraph). You describe a program,
a planner, a developer and a reviewer agent build it, and you read the plan and the review, browse
the code, and download it as a `.zip`.

## Run it

You need Node.js 22.17+ and the FastAPI backend running (from `../backend`: `uv run fastapi dev main.py`).

```bash
npm install
cp .env.example .env.local      # then fill in BACKEND_API_KEY
npm run dev                      # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `BACKEND_URL` | Where FastAPI runs. Default `http://localhost:8000`. |
| `BACKEND_API_KEY` | The same value as `AUTHENTICATED_KEY` in `backend/.env`. |

Both variables are **server-only**. The browser never sees the API key (see below).

## How it works

```
Browser ──► Next.js /api/team/...  ──(adds X-API-KEY)──►  FastAPI /api/team/...  ──►  Postgres
```

The browser only talks to Next.js. The route handlers in `src/app/api/team/` check the input and
forward it to FastAPI with the `X-API-KEY` header. This gives three things:
- the key stays on the server, out of the browser's JavaScript;
- FastAPI needs no CORS changes;
- the download button can be a plain `<a href download>`, because the proxy adds the key.

| Browser calls | Forwards to | Does |
|---|---|---|
| `POST /api/team/chat` `{message, parent_id?}` | `POST /api/team/chat` | Runs the team (can take minutes) and returns the saved run |
| `GET /api/team/runs/{id}` | `GET /api/team/runs/{id}` | Loads one saved run |
| `GET /api/team/runs/{id}/download` | `GET /api/team/runs/{id}/download` | The run's files as a `.zip` |

### Projects and versions

Every run is one row in the backend's `runs` table. A revision is a new run whose `parent_id`
points to the run it changes. The sidebar follows those links to group runs into **projects**, with
**versions** v1, v2, v3, and so on.

- With a run open, the box at the bottom asks for a **revision** (`parent_id` = the open run).
  The team starts from that run's files.
- Use **New project** to start a fresh run with no parent.
- The backend has no "list runs" endpoint, so this browser keeps shortcuts (ids, titles, status) in
  `localStorage`. The runs themselves live in Postgres. **Open a run by ID** loads any run and its
  earlier versions, for example on another computer.

### Honest loading state

The API returns the finished run only, without live progress. So while the team works, the UI shows
the three roles and a real elapsed timer, with no fake step-by-step progress. A failed request keeps
your text in the box and is never retried automatically, because each retry would start another
paid model run.

## Files

```text
src/app/api/team/      Proxy routes (server-only): chat, runs/[id], runs/[id]/download
src/lib/backend.ts     Forwards to FastAPI, adds X-API-KEY, hides backend error details
src/lib/contracts.ts   Run type, response validation, grouping runs into projects
src/lib/api.ts         Browser-side calls to the proxy
src/lib/storage.ts     Sidebar shortcuts in localStorage
src/hooks/use-runs.ts  App state: open run, pending run, errors
src/components/        app (layout), sidebar, run-view, file-viewer, composer, working, welcome
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm test        # needs a finished build: runs the real server against a fake FastAPI
```
