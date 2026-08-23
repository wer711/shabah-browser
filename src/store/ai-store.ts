import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  // citation sources if the assistant pulled from web
  sources?: { title: string; url: string }[];
}

interface AIState {
  panelOpen: boolean;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  // context action: when launched from proxy view, the AI summarizes the page
  contextUrl: string | null;
  contextTitle: string | null;

  togglePanel: (open?: boolean) => void;
  openWithContext: (url: string, title?: string) => void;
  sendMessage: (text: string) => Promise<void>;
  clear: () => void;
  setMessages: (m: ChatMessage[]) => void;
}

// NOTE: no persistence — chat lives only in the current session memory and is
// wiped on refresh. This is intentional for the "no data stored" promise.

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

export const useAIStore = create<AIState>((set, get) => ({
  panelOpen: false,
  messages: [],
  loading: false,
  error: null,
  contextUrl: null,
  contextTitle: null,

  togglePanel: (open) =>
    set((s) => ({ panelOpen: open ?? !s.panelOpen })),
  openWithContext: (url, title) =>
    set({
      panelOpen: true,
      contextUrl: url,
      contextTitle: title,
      messages: [],
      error: null,
    }),
  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
      ts: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], loading: true, error: null }));
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: get().messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          contextUrl: get().contextUrl,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `فشل (${res.status})`);
      }
      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: data.reply || "",
        ts: Date.now(),
        sources: data.sources || [],
      };
      set((s) => ({ messages: [...s.messages, aiMsg], loading: false }));
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "خطأ غير متوقع",
        loading: false,
      });
    }
  },
  clear: () => set({ messages: [], error: null, contextUrl: null, contextTitle: null }),
  setMessages: (m) => set({ messages: m }),
}));
