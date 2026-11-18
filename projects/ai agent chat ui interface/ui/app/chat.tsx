"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Menu,
  MessageSquareText,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { deleteConversation, getHistory, sendMessage } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
};

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return "";
}

const STORAGE_KEY = "agent-chat.sessions.v1";
const THEME_KEY = "agent-chat.theme.v1";

function makeConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    updatedAt: Date.now(),
    messages: [],
  };
}

function formatGroup(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return "Earlier";
}

function CodeBlock({ children }: { children: ReactElement<{ className?: string; children?: ReactNode }> }) {
  const [copied, setCopied] = useState(false);
  const code = getNodeText(children.props.children).replace(/\n$/, "");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span>{children.props.className?.replace("language-", "") || "Code"}</span>
        <button type="button" className="code-copy" onClick={copyCode} aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

const markdownComponents: Components = {
  pre: ({ children }) => {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    return <CodeBlock>{child}</CodeBlock>;
  },
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

export default function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const hasActiveMessages = Boolean(active?.messages.length);
  const isSending = activeId ? sendingIds.includes(activeId) : false;
  const historyLoading = Boolean(
    ready && activeId && hasActiveMessages && !loadedHistory.includes(activeId) && !errors[activeId],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? (JSON.parse(saved) as Conversation[]) : [];
        const restored = Array.isArray(parsed)
          ? parsed.filter(
              (item) =>
                typeof item?.id === "string" &&
                typeof item?.title === "string" &&
                Array.isArray(item?.messages),
            )
          : [];
        const sessions = restored.length ? restored : [makeConversation()];
        setConversations(sessions);
        setActiveId(sessions[0].id);
        setTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
      } catch {
        const initial = makeConversation();
        setConversations([initial]);
        setActiveId(initial.id);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(THEME_KEY, theme);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready || !activeId || loadedHistory.includes(activeId) || !hasActiveMessages) return;
    let cancelled = false;
    const sessionId = activeId;
    getHistory(sessionId)
      .then((messages) => {
        if (cancelled) return;
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === sessionId
              ? {
                  ...conversation,
                  messages: messages.map((message, index) => ({
                    id: `${sessionId}-${index}`,
                    role: message.role,
                    content: message.content,
                  })),
                }
              : conversation,
          ),
        );
        setLoadedHistory((current) => (current.includes(sessionId) ? current : [...current, sessionId]));
        setErrors((current) => {
          const next = { ...current };
          delete next[sessionId];
          return next;
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load this conversation.";
          setErrors((current) => ({ ...current, [sessionId]: message }));
          setLoadedHistory((current) => (current.includes(sessionId) ? current : [...current, sessionId]));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, hasActiveMessages, loadedHistory, ready]);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, isSending]);

  const updateConversation = useCallback(
    (id: string, update: (conversation: Conversation) => Conversation) => {
      setConversations((current) =>
        current.map((conversation) => (conversation.id === id ? update(conversation) : conversation)),
      );
    },
    [],
  );

  const createConversation = useCallback(() => {
    const conversation = makeConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setSidebarOpen(false);
    setDraft("");
    setErrors((current) => {
      const next = { ...current };
      delete next[conversation.id];
      return next;
    });
    window.setTimeout(() => textareaRef.current?.focus(), 30);
  }, []);

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        createConversation();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [createConversation]);

  const chooseConversation = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setDraft("");
  }, []);

  async function handleDeleteConversation(sessionId: string) {
    if (deletingIds.includes(sessionId)) return;
    if (!window.confirm("Delete this conversation and its saved messages? This cannot be undone.")) return;

    setDeleteError("");
    setDeletingIds((current) => [...current, sessionId]);
    try {
      await deleteConversation(sessionId);
      const remaining = conversations.filter((conversation) => conversation.id !== sessionId);
      setConversations(remaining);
      setLoadedHistory((current) => current.filter((id) => id !== sessionId));
      setErrors((current) => {
        const next = { ...current };
        delete next[sessionId];
        return next;
      });
      if (activeId === sessionId) {
        if (remaining.length) chooseConversation(remaining[0].id);
        else createConversation();
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete this conversation.");
    } finally {
      setDeletingIds((current) => current.filter((id) => id !== sessionId));
    }
  }

  async function handleSend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const query = draft.trim();
    if (!query || !active || isSending) return;

    const sessionId = active.id;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: query };
    updateConversation(sessionId, (conversation) => ({
      ...conversation,
      title: conversation.messages.length === 0 ? query.slice(0, 52) : conversation.title,
      updatedAt: Date.now(),
      messages: [...conversation.messages, userMessage],
    }));
    setLoadedHistory((current) => (current.includes(sessionId) ? current : [...current, sessionId]));
    setDraft("");
    setErrors((current) => {
      const next = { ...current };
      delete next[sessionId];
      return next;
    });
    setSendingIds((current) => [...current, sessionId]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const reply = await sendMessage(query, sessionId);
      updateConversation(sessionId, (conversation) => ({
        ...conversation,
        updatedAt: Date.now(),
        messages: [...conversation.messages, { id: crypto.randomUUID(), role: "ai", content: reply }],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The message could not be sent.";
      setErrors((current) => ({ ...current, [sessionId]: message }));
    } finally {
      setSendingIds((current) => current.filter((id) => id !== sessionId));
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  }

  function resizeComposer() {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 180)}px`;
  }

  function selectPrompt(prompt: string) {
    setDraft(prompt);
    textareaRef.current?.focus();
  }

  const groupedConversations = useMemo(() => {
    const filtered = conversations
      .filter((conversation) => conversation.title.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return ["Today", "Yesterday", "Earlier"].map((group) => ({
      group,
      items: filtered.filter((conversation) => formatGroup(conversation.updatedAt) === group),
    }));
  }, [conversations, search]);

  function handleScroll() {
    const element = messagesRef.current;
    if (!element) return;
    setShowScrollButton(element.scrollHeight - element.scrollTop - element.clientHeight > 360);
  }

  return (
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#conversation">Skip to conversation</a>
      <aside id="conversation-sidebar" className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`} aria-label="Conversation sidebar">
        <div className="sidebar-top">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true"><Sparkles size={17} strokeWidth={1.9} /></div>
            <div className="brand-copy"><span>Agent</span><small>Workspace</small></div>
            <button className="icon-button sidebar-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <button className="new-chat-button" onClick={createConversation}>
            <Plus size={17} strokeWidth={2} />
            <span>New conversation</span>
            <span className="new-chat-shortcut">Ctrl K</span>
          </button>
          <label className="search-box">
            <Search size={16} />
            <span className="sr-only">Search conversations</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" />
            {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={14} /></button>}
          </label>
        </div>

        <div className="history-area">
          <div className="history-heading">Your conversations</div>
          {deleteError && <p className="history-error" role="alert">{deleteError}</p>}
          {groupedConversations.map(({ group, items }) =>
            items.length ? (
              <section className="history-group" key={group} aria-label={group}>
                <h2>{group}</h2>
                {items.map((conversation) => (
                  <div className="history-item-row" key={conversation.id}>
                    <button
                      className={`history-item ${conversation.id === activeId ? "history-item--active" : ""}`}
                      onClick={() => chooseConversation(conversation.id)}
                      title={conversation.title}
                    >
                      <MessageSquareText size={15} />
                      <span>{conversation.title}</span>
                    </button>
                    <button
                      type="button"
                      className="history-delete"
                      aria-label={`Delete ${conversation.title}`}
                      title="Delete conversation"
                      disabled={deletingIds.includes(conversation.id)}
                      onClick={() => void handleDeleteConversation(conversation.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </section>
            ) : null,
          )}
          {groupedConversations.every(({ items }) => items.length === 0) && (
            <p className="history-empty">{search ? "No matching conversations" : "Your conversations will appear here"}</p>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="connection-indicator"><span />Backend connection is checked when you send</div>
          <button className="profile-row" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <span className="profile-avatar">{theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}</span>
            <span className="profile-label"><strong>Appearance</strong><small>{theme === "dark" ? "Dark theme" : "Light theme"}</small></span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="main-panel" id="conversation" tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-left">
          <button className="icon-button mobile-menu" aria-label="Open conversation sidebar" aria-controls="conversation-sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
            <button className="icon-button desktop-sidebar-toggle" aria-label={sidebarCollapsed ? "Open sidebar" : "Collapse sidebar"} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
            <div className="topbar-title-wrap">
              <span className="topbar-title">{active?.title || "Agent"}</span>
              <ChevronDown size={14} className="title-chevron" />
            </div>
          </div>
          <div className="topbar-right">
            <span className="model-label"><span className="model-dot" />Assistant</span>
            <span className="topbar-divider" />
            <button className="icon-button theme-button" aria-label={theme === "dark" ? "Use light appearance" : "Use dark appearance"} aria-pressed={theme === "dark"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <div className="conversation-scroll" ref={messagesRef} onScroll={handleScroll}>
          {active?.messages.length ? (
            <div className="conversation-content" aria-live="polite">
              {active.messages.map((message) => (
                <article className={`message message--${message.role}`} key={message.id}>
                  {message.role === "ai" && <div className="assistant-mark" aria-label="Assistant"><Sparkles size={15} /></div>}
                  <div className="message-body">
                    {message.role === "user" ? (
                      <div className="user-bubble">{message.content}</div>
                    ) : (
                      <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>{message.content}</ReactMarkdown></div>
                    )}
                  </div>
                </article>
              ))}
              {(isSending || historyLoading) && (
                <div className="message message--ai message--thinking" role="status">
                  <div className="assistant-mark"><Sparkles size={15} /></div>
                  <div className="thinking-label"><span className="thinking-dots"><i /><i /><i /></span>{historyLoading ? "Loading conversation" : "Thinking"}</div>
                </div>
              )}
              {errors[active.id] && (
                <div className="inline-error" role="alert">
                  <CircleAlert size={17} />
                  <span>{errors[active.id]}</span>
                  <button type="button" onClick={() => setErrors((current) => ({ ...current, [active.id]: "" }))}>Dismiss</button>
                </div>
              )}
            </div>
          ) : (
            <section className="welcome-panel">
              <div className="welcome-mark"><Sparkles size={23} strokeWidth={1.7} /></div>
              <span className="welcome-eyebrow">Agent workspace</span>
              <h1>Chat with your AI agent</h1>
              <p>Ask a question to start a conversation with your agent.</p>
              <div className="suggestion-list" aria-label="Example prompts">
                <button onClick={() => selectPrompt("Help me organize my thoughts on a project")}> <span>01</span> Organize my thoughts on a project <ArrowUp size={15} /></button>
                <button onClick={() => selectPrompt("Explain this topic in clear, simple terms")}> <span>02</span> Explain a topic in clear terms <ArrowUp size={15} /></button>
                <button onClick={() => selectPrompt("Help me find the key points in this question")}> <span>03</span> Find the key points in a question <ArrowUp size={15} /></button>
              </div>
            </section>
          )}
          {showScrollButton && active?.messages.length ? (
            <button className="scroll-bottom-button" aria-label="Scroll to latest message" onClick={() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" })}><ArrowDown size={17} /></button>
          ) : null}
        </div>

        <div className="composer-wrap">
          <form className="composer" onSubmit={(event) => void handleSend(event)}>
            <label className="composer-label" htmlFor="agent-message">Message</label>
            <textarea
              id="agent-message"
              ref={textareaRef}
              value={draft}
              onChange={(event) => { setDraft(event.target.value); resizeComposer(); }}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message your agent…"
              rows={1}
              aria-label="Message your agent"
              disabled={!ready}
            />
            <div className="composer-footer">
              <span className="composer-hint">Shift + Enter for a new line</span>
              <button className="send-button" type="submit" disabled={!draft.trim() || isSending} aria-label="Send message">
                {isSending ? <span className="send-spinner" /> : <ArrowUp size={18} strokeWidth={2.3} />}
              </button>
            </div>
          </form>
          <p className="composer-disclaimer">Responses are generated by your agent and may need review.</p>
        </div>
      </main>
    </div>
  );
}
