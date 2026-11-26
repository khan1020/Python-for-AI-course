"use client";

import { CircleCheck, CircleDashed, Download, GitCommitHorizontal, Repeat } from "lucide-react";
import { downloadUrl } from "@/lib/api";
import type { Project, Run } from "@/lib/contracts";
import { CopyButton } from "./copy-button";
import { FileViewer } from "./file-viewer";
import { Markdown } from "./markdown";

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function Section({ title, body, empty, open = true }: { title: string; body: string; empty: string; open?: boolean }) {
  return <details className="report-section" open={open}>
    <summary>{title}</summary>
    {body.trim() ? <Markdown content={body} /> : <p className="muted">{empty}</p>}
  </details>;
}

export function RunView({ run, project, select }: { run: Run; project?: Project; select: (id: string) => void }) {
  const versions = project?.versions ?? [];
  const fileCount = Object.keys(run.files).length;

  return <article className="run" data-enter>
    <header className="run-header">
      {versions.length > 1 && <nav className="version-trail" aria-label="Versions of this project">
        {versions.map((v, i) => <button key={v.id} className={v.id === run.id ? "active" : ""} aria-current={v.id === run.id ? "page" : undefined} onClick={() => select(v.id)}>
          <GitCommitHorizontal size={13} aria-hidden /> v{i + 1}
        </button>)}
      </nav>}
      <h1>{run.message}</h1>
      <div className="run-meta">
        {run.approved
          ? <span className="badge ok"><CircleCheck size={14} /> Approved by reviewer</span>
          : <span className="badge draft"><CircleDashed size={14} /> Draft: not approved</span>}
        <span><Repeat size={13} aria-hidden /> {run.attempts} developer {run.attempts === 1 ? "pass" : "passes"}</span>
        <span>{fileCount} {fileCount === 1 ? "file" : "files"}</span>
        <span>{formatDate(run.createdAt)}</span>
      </div>
      <div className="run-actions">
        {fileCount > 0
          ? <a className="primary-button" href={downloadUrl(run.id)} download><Download size={15} /> Download .zip</a>
          : <span className="primary-button" aria-disabled="true"><Download size={15} /> No files to download</span>}
        <span className="run-id"><code>{run.id}</code><CopyButton text={run.id} label="Copy run ID" /></span>
      </div>
    </header>

    <div className="run-body">
      <div className="report">
        <Section title="Summary" body={run.answer} empty="The supervisor didn’t write a summary." />
        <Section title="Plan" body={run.plan} empty="No plan this time. For small revisions the supervisor can skip the planner." open={!!run.plan.trim()} />
        <Section title="Review" body={run.review} empty="The reviewer didn’t reply in this run." />
      </div>
      <FileViewer key={run.id} files={run.files} />
    </div>
  </article>;
}
