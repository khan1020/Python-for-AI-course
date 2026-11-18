import { forwardBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return Response.json({ error: "session_id is required." }, { status: 400 });
  return forwardBackend(`/ai/history?session_id=${encodeURIComponent(sessionId)}`);
}

export async function DELETE(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return Response.json({ error: "session_id is required." }, { status: 400 });
  return forwardBackend(`/ai/history?session_id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}
