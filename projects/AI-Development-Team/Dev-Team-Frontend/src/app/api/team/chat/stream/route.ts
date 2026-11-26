import { forward, isRunId } from "@/lib/backend";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const parentId = body?.parent_id ?? null;
  if (!message || message.length > 12000 || (parentId !== null && !isRunId(parentId))) {
    return Response.json({ error: "Describe the task in up to 12,000 characters." }, { status: 400 });
  }
  return forward(
    "api/team/chat/stream",
    { method: "POST", body: JSON.stringify({ message, parent_id: parentId }) },
    { raw: true },
  );
}
