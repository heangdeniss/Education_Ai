import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Welcome from "./components/Welcome.jsx";
import Message from "./components/Message.jsx";
import Composer from "./components/Composer.jsx";
import { MenuIcon, PlusIcon } from "./components/Icons.jsx";
import { isConfigured, spaceName, streamChat } from "./api.js";
import { newConversation, uid, useConversations } from "./storage.js";

const toHistory = (messages) =>
  messages
    .filter((m) => m.content && !m.error)
    .map(({ role, content }) => ({ role, content }));

export default function App() {
  const [state, setState] = useConversations();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("searching");
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const stickRef = useRef(true);

  const active =
    state.conversations.find((c) => c.id === state.activeId) ?? state.conversations[0];

  // ---- state helpers -------------------------------------------------------
  const updateConv = (id, fn) =>
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
    }));

  const patchMsg = (convId, msgId, patch) =>
    updateConv(convId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
    }));

  // ---- chat flow -----------------------------------------------------------
  async function run(convId, priorMessages, question) {
    const botId = uid();
    updateConv(convId, (c) => ({
      ...c,
      messages: [...c.messages, { id: botId, role: "assistant", content: "", pending: true }],
    }));

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setPhase("connecting");
    stickRef.current = true;

    try {
      await streamChat({
        message: question,
        history: toHistory(priorMessages),
        signal: controller.signal,
        onPhase: setPhase,
        onData: ({ answer, sources }) =>
          patchMsg(convId, botId, { content: answer ?? "", sources: sources ?? [] }),
      });
      patchMsg(convId, botId, { pending: false });
    } catch (err) {
      console.error(err);
      patchMsg(convId, botId, {
        pending: false,
        error:
          err?.message?.includes("fetch") || err?.message?.includes("connect")
            ? "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនបានទេ។ សូមព្យាយាមម្តងទៀត។"
            : err?.message || "មានបញ្ហាកើតឡើង។",
      });
    } finally {
      if (controller.signal.aborted) patchMsg(convId, botId, { pending: false });
      abortRef.current = null;
      setBusy(false);
    }
  }

  function send(text) {
    const question = text.trim();
    if (!question || busy) return;
    const conv = active;
    const prior = conv.messages;
    updateConv(conv.id, (c) => ({
      ...c,
      title: c.title || question.slice(0, 48),
      messages: [...c.messages, { id: uid(), role: "user", content: question }],
    }));
    setInput("");
    run(conv.id, prior, question);
  }

  function regenerate() {
    if (busy) return;
    const msgs = active.messages;
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx < 0) return;
    const question = msgs[lastUserIdx].content;
    updateConv(active.id, (c) => ({ ...c, messages: c.messages.slice(0, lastUserIdx + 1) }));
    run(active.id, msgs.slice(0, lastUserIdx), question);
  }

  const stop = () => abortRef.current?.abort();

  function newChat() {
    setSidebarOpen(false);
    if (active.messages.length === 0) return;
    const conv = newConversation();
    setState((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }));
  }

  function selectChat(id) {
    setState((s) => ({ ...s, activeId: id }));
    setSidebarOpen(false);
  }

  function deleteChat(id) {
    if (busy && id === active.id) stop();
    setState((s) => {
      let conversations = s.conversations.filter((c) => c.id !== id);
      if (!conversations.length) conversations = [newConversation()];
      const activeId = s.activeId === id ? conversations[0].id : s.activeId;
      return { conversations, activeId };
    });
  }

  // ---- auto scroll ---------------------------------------------------------
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [active.messages]);

  useEffect(() => {
    stickRef.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const empty = active.messages.length === 0;

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        conversations={state.conversations}
        activeId={active.id}
        onSelect={selectChat}
        onNew={newChat}
        onDelete={deleteChat}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)} title="Menu">
            <MenuIcon />
          </button>
          <div className="topbar-title">{active.title || "ជំនួយការសិក្សា ថ្នាក់ទី១២"}</div>
          <div className={`status-pill ${isConfigured ? "ok" : "bad"}`} title={spaceName}>
            <span className="dot" />
            {isConfigured ? "Qwen2.5 · RAG" : "មិនទាន់កំណត់ Space"}
          </div>
          <button className="icon-btn mobile-only" onClick={newChat} title="ការសន្ទនាថ្មី">
            <PlusIcon />
          </button>
        </header>

        <div className="scroll" ref={scrollRef} onScroll={onScroll}>
          {empty ? (
            <Welcome onAsk={send} />
          ) : (
            <div className="thread">
              {active.messages.map((m, i) => (
                <Message
                  key={m.id}
                  message={m}
                  phase={phase}
                  isLast={i === active.messages.length - 1}
                  onRegenerate={regenerate}
                />
              ))}
            </div>
          )}
        </div>

        <Composer value={input} onChange={setInput} onSend={send} onStop={stop} busy={busy} />
      </main>
    </div>
  );
}
