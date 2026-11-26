"use client";

import { LoaderCircle, Menu, RefreshCw, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRuns } from "@/hooks/use-runs";
import { useTheme } from "@/hooks/use-theme";
import type { Project } from "@/lib/contracts";
import { Composer } from "./composer";
import { Dialog } from "./dialog";
import { RunView } from "./run-view";
import { Sidebar } from "./sidebar";
import { Welcome } from "./welcome";
import { Working } from "./working";

const RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function App() {
  const runs = useRuns();
  const theme = useTheme();
  const [draft, setDraft] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState<{ kind: "import" } | { kind: "forget"; project: Project } | null>(null);
  const [field, setField] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  // "v2" label for a run id, from the project it belongs to
  const versionOf = (id: string | null) => {
    const p = runs.projects.find((p) => p.versions.some((v) => v.id === id));
    return p ? `v${p.versions.findIndex((v) => v.id === id) + 1}` : null;
  };
  const revising = runs.activeId ? versionOf(runs.activeId) ?? "this run" : null;

  async function send() {
    if (await runs.send(draft)) setDraft("");   // keep the draft if the run fails
  }
  function go(id: string | null) { runs.select(id); setDrawer(false); }

  async function submitImport(e: React.FormEvent) {
    e.preventDefault();
    const id = field.trim();
    if (!RUN_ID.test(id)) { setImportError("Paste a full run ID, like 1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed."); return; }
    setImporting(true); setImportError(null);
    try { await runs.importRun(id); setModal(null); setDrawer(false); }
    catch (err) { setImportError(err instanceof Error ? err.message : "Couldn’t open that run."); }
    finally { setImporting(false); }
  }

  // Mobile drawer: close with Escape, keep focus inside while open, close when resizing to desktop.
  useEffect(() => {
    const media = matchMedia("(max-width: 860px)");
    const onChange = () => { if (!media.matches) setDrawer(false); };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const el = drawerRef.current;
    el?.querySelector<HTMLElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setDrawer(false); menuRef.current?.focus(); }
      if (event.key === "Tab") {
        const items = Array.from(el?.querySelectorAll<HTMLElement>("button:not(:disabled),a,input") || []);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const title = runs.pending ? "Working…" : runs.activeProject?.title ?? "New project";

  return <div className={`app ${drawer ? "drawer-open" : ""}`}>
    <a href="#task" className="skip-link">Skip to the task box</a>
    {drawer && <button className="backdrop" onClick={() => setDrawer(false)} aria-label="Close projects" />}

    <aside ref={drawerRef} className="sidebar" id="projects" aria-label="Projects">
      <Sidebar projects={runs.projects} activeId={runs.activeId} ready={runs.ready} storageError={runs.storageError}
        select={go} newProject={() => go(null)} close={() => setDrawer(false)}
        importRun={() => { setField(""); setImportError(null); setModal({ kind: "import" }); }}
        forget={(project) => setModal({ kind: "forget", project })} {...theme} />
    </aside>

    <main className="workspace" inert={drawer || undefined}>
      <header className="topbar">
        <button ref={menuRef} className="icon-button menu-button" onClick={() => setDrawer(true)} aria-label="Open projects" aria-expanded={drawer} aria-controls="projects"><Menu size={19} /></button>
        <span className="topbar-title" title={title}>{title}</span>
      </header>

      <div className="scroll">
        {!runs.ready ? <div className="center muted"><LoaderCircle className="spin" size={20} /> Loading…</div>
          : runs.pending ? <Working pending={runs.pending} revising={runs.pending.parentId ? versionOf(runs.pending.parentId) ?? "a run" : null} />
          : !runs.activeId ? <Welcome disabled={!runs.ready} onPrompt={(q) => { setDraft(q); document.getElementById("task")?.focus(); }} />
          : runs.active ? <RunView run={runs.active} project={runs.activeProject} select={go} />
          : runs.loadError ? <div className="notice" role="alert"><TriangleAlert size={18} /><div>
              <strong>Couldn’t load this run</strong><p>{runs.loadError}</p>
              <div className="notice-actions"><button className="secondary-button" onClick={runs.retryLoad}><RefreshCw size={14} /> Try again</button>
                <button className="text-button" onClick={() => go(null)}>Start a new project</button></div>
            </div></div>
          : <div className="center muted"><LoaderCircle className="spin" size={20} /> Loading run…</div>}
      </div>

      {runs.sendError && <div className="send-error" role="alert"><TriangleAlert size={16} /><span>{runs.sendError}</span>
        <button className="icon-button tiny" onClick={() => runs.select(runs.activeId)} aria-label="Dismiss error"><X size={14} /></button></div>}
      <Composer value={draft} onChange={setDraft} onSend={send} onNewProject={() => go(null)}
        revising={revising} disabled={!runs.ready} pending={!!runs.pending} />
    </main>

    {modal?.kind === "import" && <Dialog title="Open a run by ID" onClose={() => setModal(null)}>
      <form onSubmit={submitImport}>
        <p className="dialog-text">Every run has an ID, shown under its title. Paste one to load it and its earlier versions from Postgres.</p>
        <label className="field-label" htmlFor="run-id">Run ID</label>
        <input id="run-id" className="dialog-input" value={field} onChange={(e) => setField(e.target.value)} placeholder="1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed" autoFocus spellCheck={false} />
        {importError && <p className="field-error" role="alert">{importError}</p>}
        <button className="primary-button wide" disabled={!field.trim() || importing}>{importing ? <LoaderCircle size={15} className="spin" /> : null} Open run</button>
      </form>
    </Dialog>}

    {modal?.kind === "forget" && <Dialog title="Remove this project?" onClose={() => setModal(null)}>
      <p className="dialog-text">“{modal.project.title}” and its {modal.project.versions.length} {modal.project.versions.length === 1 ? "version" : "versions"} are removed from this browser’s sidebar only. The runs stay in Postgres, and you can reopen them by ID.</p>
      <div className="dialog-actions">
        <button className="secondary-button" onClick={() => setModal(null)}>Keep it</button>
        <button className="primary-button danger" onClick={() => { runs.forgetProject(modal.project.versions.map((v) => v.id)); setModal(null); }}>Remove</button>
      </div>
    </Dialog>}
  </div>;
}
