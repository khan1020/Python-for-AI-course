const backendUrl = process.env.BACKEND_API_URL?.replace(/\/$/, "");

export function backendNotConfigured() {
  return Response.json(
    { error: "Set BACKEND_API_URL in ui/.env.local to connect the chat backend." },
    { status: 503 },
  );
}

export async function forwardBackend(path: string, init?: RequestInit) {
  if (!backendUrl) return backendNotConfigured();
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: { Accept: "application/json", ...init?.headers },
      signal: AbortSignal.timeout(120_000),
    });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Could not reach the FastAPI backend. Check that it is running and BACKEND_API_URL is correct." },
      { status: 502 },
    );
  }
}
