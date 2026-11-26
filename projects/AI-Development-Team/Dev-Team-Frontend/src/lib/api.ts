import { parseEvents, parseRun, type Progress, type Run } from "./contracts";


// Browser -> Next.js proxy (/api/team/...) -> FastAPI. No API key in the browser.
async function open(path: string, init?: RequestInit) {
 let response: Response;
 try {
   response = await fetch(`/api/team/${path}`, { ...init, cache: "no-store" });
 } catch {
   throw new Error("Couldn’t reach the app server. Check your connection.");
 }
 if (!response.ok) {
   const body: unknown = await response.json().catch(() => null);
   const error = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : null;
   throw new Error(error || "Something went wrong. Please try again.");
 }
 return response;
}


export async function createRun(message: string, parentId: string | null, onProgress: (event: Progress) => void): Promise<Run> {
 const response = await open("chat/stream", {
   method: "POST", headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ message, parent_id: parentId }),
 });
 const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
 const lost = "Lost the connection during the run. It may not have been saved.";
 let buffer = "";
 for (;;) {
   const { value, done } = await reader.read().catch(() => { throw new Error(lost); });
   if (done) throw new Error(lost);   // a finished run always sends "done" or "error" first
   const parsed = parseEvents(buffer + value);
   buffer = parsed.rest;
   for (const event of parsed.events) {
     if (event.type === "done") return parseRun(event.run);
     if (event.type === "error") throw new Error(String(event.error));
     onProgress(event as Progress);
   }
 }
}


export const getRun = async (id: string) => parseRun(await (await open(`runs/${encodeURIComponent(id)}`)).json().catch(() => null));


export const downloadUrl = (id: string) => `/api/team/runs/${encodeURIComponent(id)}/download`;



