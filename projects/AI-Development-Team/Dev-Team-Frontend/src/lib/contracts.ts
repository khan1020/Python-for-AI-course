// Shapes returned by FastAPI (modules/ai_agent/service.py -> to_response).
// Checked at the network boundary so a backend change fails loudly, not silently.
export type Run = {
  id: string; parentId: string | null; message: string; createdAt: string;
  answer: string; plan: string; review: string; approved: boolean; attempts: number;
  files: Record<string, string>;
};

// Live events from FastAPI while a run is in progress (service.py -> progress).
export type Progress =
  | { type: "agent"; name: string; status: "start" | "done"; approved?: boolean }
  | { type: "tool"; agent: string; name: string; path: string | null };

// Splits buffered SSE text into complete events; `rest` is an unfinished event to keep.
export function parseEvents(buffer: string): { events: Record<string, unknown>[]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  return { rest, events: blocks.filter((b) => b.startsWith("data: ")).map((b) => JSON.parse(b.slice(6))) };
}


// What this browser remembers about a run (the sidebar). The full run lives in Postgres.
export type RunMeta = { id: string; parentId: string | null; title: string; approved: boolean; createdAt: string };

const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string";

export function parseRun(value: unknown): Run {
  const r = record(value) && record(value.result) ? value.result : null;
  if (!record(value) || !r || !text(value.id) || !(value.parent_id === null || text(value.parent_id)) ||
    !text(value.message) || !text(value.created_at) || !text(r.answer) || !text(r.plan) || !text(r.review) ||
    typeof r.approved !== "boolean" || typeof r.attempts !== "number" ||
    !record(r.files) || !Object.values(r.files).every(text)) {
    throw new Error("The backend returned a run in an unexpected shape.");
  }
  return {
    id: value.id, parentId: value.parent_id, message: value.message, createdAt: value.created_at,
    answer: r.answer, plan: r.plan, review: r.review, approved: r.approved, attempts: r.attempts,
    files: r.files as Record<string, string>,
  };
}

export const toMeta = (run: Run): RunMeta => ({
  id: run.id, parentId: run.parentId, title: run.message.slice(0, 80), approved: run.approved, createdAt: run.createdAt,
});

// Group runs into projects by following parent_id up to the oldest run this browser knows.
export type Project = { rootId: string; title: string; versions: RunMeta[] };

export function toProjects(runs: RunMeta[]): Project[] {
  const byId = new Map(runs.map((r) => [r.id, r]));
  const rootOf = (run: RunMeta) => {
    let current = run;
    for (let i = 0; i < 100 && current.parentId && byId.has(current.parentId); i++) current = byId.get(current.parentId)!;
    return current;
  };
  const groups = new Map<string, Project>();
  for (const run of runs) {
    const root = rootOf(run);
    const project = groups.get(root.id) ?? { rootId: root.id, title: root.title, versions: [] };
    project.versions.push(run);
    groups.set(root.id, project);
  }
  const projects = [...groups.values()];
  for (const p of projects) p.versions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // newest activity first
  return projects.sort((a, b) => b.versions.at(-1)!.createdAt.localeCompare(a.versions.at(-1)!.createdAt));
}
