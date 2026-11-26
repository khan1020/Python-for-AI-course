import "server-only";

// Server-only bridge to FastAPI. The browser never sees BACKEND_URL or BACKEND_API_KEY:
// it calls /api/team/..., and this file adds the X-API-KEY header on the server.
const TIMEOUT_MS = 600000; // a full plan -> code -> review loop can take a few minutes

export async function forward(path: string, init?: RequestInit, { raw = false } = {}): Promise<Response> {
  const configured = process.env.BACKEND_URL || "http://localhost:8000";
  let base: URL;
  try {
    base = new URL(configured.endsWith("/") ? configured : `${configured}/`);
    if (!["http:", "https:"].includes(base.protocol)) throw new Error();
  } catch {
    return Response.json({ error: "BACKEND_URL is not a valid http(s) URL." }, { status: 503 });
  }
  try {
    const response = await fetch(new URL(path, base), {
      ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "Content-Type": "application/json", "X-API-KEY": process.env.BACKEND_API_KEY || "" },
    });
    if (!response.ok) {
      // Never pass backend details (stack traces, provider errors) through to the browser.
      const error = response.status === 404 ? "That run doesn’t exist on the backend."
        : response.status === 403 ? "The backend rejected the API key. Check BACKEND_API_KEY in .env.local."
        : response.status === 429 ? "The model is rate limited. Wait a moment and try again."
        : response.status === 422 ? "The backend rejected this request."
        : "The team couldn’t finish this run. Check the FastAPI logs.";
      return Response.json({ error }, { status: response.status >= 500 ? 502 : response.status });
    }
    if (raw) {
      return new Response(response.body, { headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": response.headers.get("Content-Disposition") || "attachment",
        "Cache-Control": "no-store, no-transform",
      } });
    }
    return Response.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return Response.json({ error: timedOut
      ? "The team took longer than 10 minutes. The run may still finish on the backend, but this page can’t get its ID."
      : "Couldn’t reach FastAPI. Make sure the backend is running on BACKEND_URL." },
    { status: timedOut ? 504 : 503 });
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRunId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);
