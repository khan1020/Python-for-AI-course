import { forwardBackend } from "@/lib/backend";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { query?: unknown }).query !== "string" ||
    typeof (payload as { session_id?: unknown }).session_id !== "string"
  ) {
    return Response.json({ error: "Both query and session_id are required." }, { status: 400 });
  }
  return forwardBackend("/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
