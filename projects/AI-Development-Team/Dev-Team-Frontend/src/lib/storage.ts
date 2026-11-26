import type { RunMeta } from "./contracts";

// The backend has no "list runs" endpoint, so this browser keeps shortcuts to the runs it made.
const KEY = "devteam.runs.v1";

export function readRuns(): { runs: RunMeta[]; activeId: string | null } {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!value || !Array.isArray(value.runs)) return { runs: [], activeId: null };
    const runs: RunMeta[] = value.runs.filter((r: RunMeta) => r && typeof r.id === "string" &&
      (r.parentId === null || typeof r.parentId === "string") && typeof r.title === "string" &&
      typeof r.approved === "boolean" && typeof r.createdAt === "string");
    return { runs, activeId: runs.some((r) => r.id === value.activeId) ? value.activeId : null };
  } catch { return { runs: [], activeId: null }; }
}

export function saveRuns(runs: RunMeta[], activeId: string | null): boolean {
  try { localStorage.setItem(KEY, JSON.stringify({ runs, activeId })); return true; }
  catch { return false; }
}
