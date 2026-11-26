"use client";


import { Check, Route } from "lucide-react";
import { useEffect, useState } from "react";
import type { Pending } from "@/hooks/use-runs";
import type { Progress } from "@/lib/contracts";
import { ROLES } from "./welcome";


const TEAM = [{ icon: Route, name: "Supervisor" }, ...ROLES];
const title = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);


// Turns raw events into readable lines: handoffs, tool calls, results.
function describe(events: Progress[]) {
 const lines: string[] = [];
 let previous = "", passes = 0;
 for (const e of events) {
   if (e.type === "tool") {
     lines.push(`${title(e.agent)} used ${e.name}${e.path ? ` on ${e.path}` : ""}`);
   } else if (e.status === "start") {
     if (e.name === "developer") passes++;
     const pass = e.name === "developer" ? ` (pass ${passes})` : "";
     if (e.name === "supervisor") lines.push(previous ? "Back to Supervisor" : "Query sent to Supervisor");
     else lines.push(`Supervisor sent the query to ${title(e.name)}${pass}`);
     previous = e.name;
   } else if (e.name !== "supervisor") {
     const verdict = e.approved === undefined ? "" : e.approved ? ": approved" : ": changes requested";
     lines.push(`${title(e.name)} finished${verdict}`);
   }
 }
 return lines;
}


export function Working({ pending, revising }: { pending: Pending; revising: string | null }) {
 const [seconds, setSeconds] = useState(0);
 useEffect(() => {
   const started = Date.now();
   const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
   return () => clearInterval(timer);
 }, []);
 const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;


 // the latest status per agent decides its pill: working, done or not reached
 const status = new Map<string, "start" | "done">();
 for (const e of pending.events) if (e.type === "agent") status.set(e.name, e.status);
 const lines = describe(pending.events);


 return <div className="working" data-enter>
   <p className="sr-only" role="status">{lines.at(-1) ?? "The team is working on your request."}</p>
   <p className="eyebrow">{revising ? `Revising ${revising}` : "New project"}</p>
   <h1>{pending.message}</h1>
   <ol className="team-status">
     {TEAM.map(({ icon: Icon, name }) => {
       const state = status.get(name.toLowerCase());
       return <li key={name} className={state ?? "idle"} aria-current={state === "start" ? "step" : undefined}>
         {state === "done" ? <Check size={13} aria-hidden /> : <span className="pulse" aria-hidden />}
         <Icon size={16} strokeWidth={1.6} aria-hidden />{name}</li>;
     })}
   </ol>
   <p className="muted">Most runs take one to three minutes.<span className="elapsed">{elapsed}</span></p>
   <ol className="activity" aria-label="Activity">
     {lines.map((line, i) => <li key={i}>{line}</li>)}
   </ol>
 </div>;
}



