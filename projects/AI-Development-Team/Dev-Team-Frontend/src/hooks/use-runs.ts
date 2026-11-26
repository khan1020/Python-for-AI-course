"use client";


import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createRun, getRun } from "@/lib/api";
import { toMeta, toProjects, type Progress, type Run, type RunMeta } from "@/lib/contracts";
import { readRuns, saveRuns } from "@/lib/storage";


export type Pending = { message: string; parentId: string | null; events: Progress[] };


type State = {
 ready: boolean;
 metas: RunMeta[];                 // sidebar shortcuts, saved in localStorage
 activeId: string | null;          // null = "new project"
 cache: Record<string, Run>;       // full runs fetched during this visit
 storageError: boolean;
};
type Action =
 | { type: "boot"; metas: RunMeta[]; activeId: string | null }
 | { type: "remember"; run: Run; select?: boolean }
 | { type: "select"; id: string | null }
 | { type: "forget"; ids: string[] }
 | { type: "storage-error" };


function reducer(state: State, action: Action): State {
 switch (action.type) {
   case "boot": return { ...state, ready: true, metas: action.metas, activeId: action.activeId };
   case "remember": return {
     ...state,
     cache: { ...state.cache, [action.run.id]: action.run },
     metas: [...state.metas.filter((m) => m.id !== action.run.id), toMeta(action.run)],
     activeId: action.select ? action.run.id : state.activeId,
   };
   case "select": return { ...state, activeId: action.id };
   case "forget": return {
     ...state, metas: state.metas.filter((m) => !action.ids.includes(m.id)),
     activeId: state.activeId && action.ids.includes(state.activeId) ? null : state.activeId,
   };
   case "storage-error": return { ...state, storageError: true };
 }
}


export function useRuns() {
 const [state, dispatch] = useReducer(reducer, { ready: false, metas: [], activeId: null, cache: {}, storageError: false });
 const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null);
 const [attempt, setAttempt] = useState(0);   // bump to retry a failed load
 const [pending, setPending] = useState<Pending | null>(null);
 const [sendError, setSendError] = useState<string | null>(null);
 const busy = useRef(false);                   // one team run at a time; never auto-retry a POST
 const { ready, metas, activeId, cache } = state;


 // localStorage is an external system: read it once after mount, write it on every change.
 useEffect(() => { const saved = readRuns(); dispatch({ type: "boot", metas: saved.runs, activeId: saved.activeId }); }, []);
 useEffect(() => { if (ready && !saveRuns(metas, activeId)) dispatch({ type: "storage-error" }); }, [ready, metas, activeId]);


 // Fetch the open run from Postgres if this visit hasn't loaded it yet.
 const active = activeId ? cache[activeId] : undefined;
 useEffect(() => {
   if (!ready || !activeId || active) return;
   let cancelled = false;
   getRun(activeId)
     .then((run) => { if (!cancelled) dispatch({ type: "remember", run }); })
     .catch((e: Error) => { if (!cancelled) setLoadError({ id: activeId, message: e.message }); });
   return () => { cancelled = true; };
 }, [ready, activeId, active, attempt]);


 async function send(message: string): Promise<boolean> {
   message = message.trim();
   if (!message || busy.current) return false;
   busy.current = true;
   const parentId = activeId;   // revise the open run, or start a new project
   setPending({ message, parentId, events: [] }); setSendError(null);
   try {
     const run = await createRun(message, parentId, (event) =>
       setPending((p) => p && { ...p, events: [...p.events, event] }));
     dispatch({ type: "remember", run, select: true });
     return true;
   } catch (e) {
     setSendError(e instanceof Error ? e.message : "The run failed.");
     return false;
   } finally { busy.current = false; setPending(null); }
 }


 // Open a run by ID, plus the earlier versions it was built from (up to 20).
 async function importRun(id: string) {
   let next: string | null = id;
   for (let i = 0; next && i < 20; i++) {
     const run = await getRun(next);
     dispatch({ type: "remember", run, select: i === 0 });
     next = run.parentId && !metas.some((m) => m.id === run.parentId) ? run.parentId : null;
   }
 }


 const projects = useMemo(() => toProjects(metas), [metas]);


 return {
   ready, projects, activeId, active, pending, sendError, storageError: state.storageError,
   activeProject: projects.find((p) => p.versions.some((v) => v.id === activeId)),
   loadError: loadError && loadError.id === activeId ? loadError.message : null,
   select: (id: string | null) => { dispatch({ type: "select", id }); setSendError(null); },
   retryLoad: () => { setLoadError(null); setAttempt((a) => a + 1); },
   forgetProject: (ids: string[]) => dispatch({ type: "forget", ids }),
   send, importRun,
 };
}



