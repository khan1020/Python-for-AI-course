export type HistoryMessage = { role: "user" | "ai"; content: string };

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { detail?: unknown; error?: string }
    | null;
  if (!response.ok) {
    const detail = payload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : typeof payload?.error === "string"
          ? payload.error
          : `The backend returned an error (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function sendMessage(query: string, sessionId: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId }),
  });
  const data = await readResponse<{ answer: string; session_id: string }>(response);
  return data.answer;
}

export async function getHistory(sessionId: string) {
  const response = await fetch(`/api/history?session_id=${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
  const data = await readResponse<{ messages: HistoryMessage[]; session_id: string }>(response);
  return data.messages;
}

export async function deleteConversation(sessionId: string) {
  const response = await fetch(`/api/history?session_id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
  await readResponse<{ deleted: number; session_id: string }>(response);
}
