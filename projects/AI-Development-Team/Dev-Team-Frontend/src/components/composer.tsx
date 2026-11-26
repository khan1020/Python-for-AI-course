"use client";

import { ArrowUp, GitBranch, LoaderCircle, Sparkles } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

export function Composer({ value, onChange, onSend, onNewProject, revising, disabled, pending }: {
  value: string; onChange: (value: string) => void; onSend: () => void; onNewProject: () => void;
  revising: string | null; disabled: boolean; pending: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {   // grow with the text, up to ~8 lines
    if (ref.current) { ref.current.style.height = "0px"; ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`; }
  }, [value]);
  const canSend = !disabled && !pending && !!value.trim();

  return <div className="composer-area">
    <form className={`composer ${pending ? "is-pending" : ""}`} onSubmit={(e) => { e.preventDefault(); if (canSend) onSend(); }}>
      <div className="composer-mode">
        {revising
          ? <><GitBranch size={13} /> Revising <b>{revising}</b>. The team starts from its files.
            <button type="button" className="text-button" onClick={onNewProject} disabled={pending}>Start a new project instead</button></>
          : <><Sparkles size={13} /> New project. The planner will scope it first.</>}
      </div>
      <label htmlFor="task" className="sr-only">{revising ? "Describe the change" : "Describe what to build"}</label>
      <textarea id="task" ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={1} maxLength={12000} disabled={disabled}
        placeholder={revising ? "What should change? e.g. “Handle division by zero and add tests”" : "Describe what the team should build…"}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (canSend) onSend(); } }} />
      <div className="composer-bottom">
        <span className="hint"><kbd>↵</kbd> run · <kbd>⇧↵</kbd> new line</span>
        <button className="send-button" type="submit" disabled={!canSend} aria-label={pending ? "The team is working" : revising ? "Request revision" : "Start run"}>
          {pending ? <LoaderCircle size={17} className="spin" /> : <ArrowUp size={18} />}
        </button>
      </div>
    </form>
  </div>;
}
