import { useEffect, useState } from "react";

const KEY = "kh12-chats-v1";

export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function newConversation() {
  return { id: uid(), title: "", createdAt: Date.now(), messages: [] };
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(data?.conversations) && data.conversations.length) {
      // Drop any half-finished streaming state from a previous session.
      data.conversations.forEach((c) =>
        c.messages.forEach((m) => {
          if (m.pending) {
            m.pending = false;
            if (!m.content) m.error = "បានផ្អាក";
          }
        })
      );
      return data;
    }
  } catch {
    /* ignore */
  }
  const first = newConversation();
  return { conversations: [first], activeId: first.id };
}

/** Conversations persisted in localStorage. */
export function useConversations() {
  const [state, setState] = useState(load);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(KEY, JSON.stringify(state)), 300);
    return () => clearTimeout(t);
  }, [state]);

  return [state, setState];
}
