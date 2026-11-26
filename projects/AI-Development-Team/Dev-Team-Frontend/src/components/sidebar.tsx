"use client";

import { FolderGit2, Import, Moon, PanelLeftClose, Plus, Sun, Trash2 } from "lucide-react";
import type { Project } from "@/lib/contracts";

export function Sidebar({ projects, activeId, ready, storageError, select, newProject, importRun, forget, close, dark, toggleTheme }: {
  projects: Project[]; activeId: string | null; ready: boolean; storageError: boolean;
  select: (id: string) => void; newProject: () => void; importRun: () => void; forget: (p: Project) => void;
  close: () => void; dark: boolean; toggleTheme: () => void;
}) {
  return <>
    <div className="sidebar-brand">
      <button className="wordmark" onClick={newProject} aria-label="AI Development Team, new project">
        <span className="wordmark-mark" aria-hidden>{"</>"}</span><span>dev<b>team</b></span>
      </button>
      <button className="icon-button sidebar-close" onClick={close} aria-label="Close sidebar"><PanelLeftClose size={18} /></button>
    </div>

    <div className="sidebar-content">
      <button className="new-project" onClick={newProject} disabled={!ready}><Plus size={16} /> New project</button>

      <div className="project-list">
        <h2 className="section-label">Projects</h2>
        {!ready ? <p className="sidebar-note">Loading…</p>
          : !projects.length ? <p className="sidebar-note">Runs you start appear here, grouped by project. Each revision becomes a new version.</p>
          : projects.map((project) => <section key={project.rootId} className="project">
            <div className="project-head">
              <FolderGit2 size={14} aria-hidden />
              <span title={project.title}>{project.title}</span>
              <button className="icon-button tiny" onClick={() => forget(project)} aria-label={`Remove ${project.title} from this browser`}><Trash2 size={13} /></button>
            </div>
            <ol className="versions">
              {project.versions.map((v, i) => <li key={v.id}>
                <button className={`version ${v.id === activeId ? "active" : ""}`} aria-current={v.id === activeId ? "page" : undefined}
                  onClick={() => select(v.id)} title={v.title}>
                  <span className={`dot ${v.approved ? "ok" : "draft"}`} aria-hidden />
                  <span className="version-number">v{i + 1}</span>
                  <span className="version-title">{v.title}</span>
                  <span className="sr-only">{v.approved ? "approved" : "draft"}</span>
                </button>
              </li>)}
            </ol>
          </section>)}
      </div>

      <button className="sidebar-link" onClick={importRun} disabled={!ready}><Import size={14} /> Open a run by ID</button>
    </div>

    <div className="sidebar-footer">
      <p>{storageError ? "Browser storage is unavailable. Copy run IDs before leaving." : "Shortcuts live in this browser. Runs are stored in Postgres."}</p>
      <button className="icon-button" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  </>;
}
