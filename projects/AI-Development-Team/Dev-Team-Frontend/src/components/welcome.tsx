"use client";

import { ArrowUpRight, ClipboardList, Code2, SearchCheck } from "lucide-react";

const examples = [
  { title: "CLI calculator", query: "Build a command-line calculator in Python that supports + - * / and handles division by zero." },
  { title: "Email validator", query: "Write a Python function that validates email addresses, with unit tests using unittest." },
  { title: "To-do list module", query: "Create a small to-do list module that saves tasks to a JSON file, with add, complete and list functions." },
  { title: "Word counter", query: "Write a script that reads a text file and prints the 10 most common words, ignoring case and punctuation." },
];

export const ROLES = [
  { icon: ClipboardList, name: "Planner", does: "Turns your request into steps and acceptance criteria." },
  { icon: Code2, name: "Developer", does: "Writes complete files and fixes review feedback." },
  { icon: SearchCheck, name: "Reviewer", does: "Checks the code against the criteria, then approves it or requests changes." },
];

export function Welcome({ onPrompt, disabled }: { onPrompt: (query: string) => void; disabled: boolean }) {
  return <div className="welcome" data-enter>
    <p className="eyebrow">AI Development Team</p>
    <h1>Describe a program.<br /><em>Three agents build it.</em></h1>
    <p className="lede">A supervisor passes your request to a planner, a developer and a reviewer.
      The developer gets up to three passes to satisfy the review. Then you can download the code.</p>

    <ol className="pipeline" aria-label="How a run works">
      {ROLES.map(({ icon: Icon, name, does }, i) => <li key={name}>
        <span className="pipeline-step">{i + 1}</span>
        <Icon size={18} strokeWidth={1.6} aria-hidden />
        <strong>{name}</strong><span>{does}</span>
      </li>)}
    </ol>

    <h2 className="section-label">Try one</h2>
    <div className="examples">
      {examples.map(({ title, query }) => <button key={title} className="example" onClick={() => onPrompt(query)} disabled={disabled}>
        <strong>{title}</strong><span>{query}</span><ArrowUpRight size={15} className="example-arrow" aria-hidden />
      </button>)}
    </div>
  </div>;
}
