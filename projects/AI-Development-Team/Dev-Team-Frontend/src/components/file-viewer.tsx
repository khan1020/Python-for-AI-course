"use client";

import { Download, FileCode2 } from "lucide-react";
import hljs from "highlight.js/lib/common";
import { useMemo, useState } from "react";
import { CopyButton } from "./copy-button";

const LANGUAGES: Record<string, string> = {
  py: "python", js: "javascript", mjs: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  json: "json", md: "markdown", html: "xml", xml: "xml", css: "css", sh: "bash", toml: "ini", ini: "ini",
  yml: "yaml", yaml: "yaml", sql: "sql", txt: "plaintext",
};
const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

function highlight(path: string, code: string) {
  const language = LANGUAGES[path.split(".").pop()?.toLowerCase() || ""];
  // hljs escapes the code itself, so its HTML output is safe to inject
  return language && hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : escape(code);
}

function saveFile(path: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = path.split("/").pop() || "file.txt"; a.click();
  URL.revokeObjectURL(url);
}

export function FileViewer({ files }: { files: Record<string, string> }) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const [picked, setPicked] = useState<string | null>(null);
  const path = picked && picked in files ? picked : paths[0];

  if (!path) return <div className="files empty-files"><FileCode2 size={22} strokeWidth={1.4} />
    <p>No files in this run.</p><span>The developer didn’t save anything. Check the summary for the reason.</span></div>;

  const code = files[path];
  const lines = code.split("\n").length;
  return <div className="files">
    <div className="file-tabs" role="tablist" aria-label="Files">
      {paths.map((p) => <button key={p} role="tab" aria-selected={p === path} className={`file-tab ${p === path ? "active" : ""}`} onClick={() => setPicked(p)} title={p}>
        <FileCode2 size={13} aria-hidden /><span>{p}</span>
      </button>)}
    </div>
    <div className="file-panel" role="tabpanel" aria-label={path}>
      <div className="file-head">
        <code>{path}</code>
        <span className="file-size">{lines} {lines === 1 ? "line" : "lines"}</span>
        <CopyButton text={code} label={`Copy ${path}`} showLabel />
        <button className="copy-button with-label" onClick={() => saveFile(path, code)} aria-label={`Download ${path}`}><Download size={14} /><span>File</span></button>
      </div>
      <div className="code-view">
        <pre className="gutter" aria-hidden>{Array.from({ length: lines }, (_, i) => i + 1).join("\n")}</pre>
        <pre className="code"><code className="hljs" dangerouslySetInnerHTML={{ __html: highlight(path, code) }} /></pre>
      </div>
    </div>
  </div>;
}
