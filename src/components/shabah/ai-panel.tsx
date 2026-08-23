"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ghost,
  X,
  Send,
  Eraser,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useAIStore, type ChatMessage } from "@/store/ai-store";

/**
 * Slide-in side panel for AI chat (Opera Aria style).
 *
 * Layout (RTL doc):
 *  - The panel lives at the physical LEFT edge of the viewport, which in
 *    an RTL document appears on the visual "right" side (the trailing
 *    edge of the reading flow). Width ~380px, full height.
 *  - User messages sit on the visual LEFT (RTL chat convention), assistant
 *    messages on the visual RIGHT with a primary tint.
 *  - framer-motion drives the slide-in/out animation via AnimatePresence.
 */

function BouncingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="يكتب الآن">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/80"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      // In an RTL column, justify-end → visual LEFT, justify-start → visual RIGHT.
      dir="rtl"
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm break-words ${
          isUser
            ? "bg-primary text-primary-foreground rounded-bl-md"
            : "bg-primary/10 text-foreground border border-primary/20 rounded-br-md"
        }`}
      >
        {msg.content}
        {msg.sources && msg.sources.length > 0 && (
          <ul className="mt-2 pt-2 border-t border-primary/20 flex flex-col gap-1">
            {msg.sources.map((s, i) => (
              <li key={`${s.url}-${i}`} className="text-xs text-primary-foreground/90">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{s.title || s.url}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AiPanel() {
  const {
    panelOpen,
    togglePanel,
    messages,
    sendMessage,
    loading,
    error,
    clear,
    contextUrl,
    contextTitle,
  } = useAIStore();

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const txt = input.trim();
    if (!txt || loading) return;
    setInput("");
    await sendMessage(txt);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit();
    }
  };

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          {/* Backdrop — click anywhere outside the panel to close */}
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => togglePanel(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            aria-hidden
          />

          {/* Panel — slides in from the physical LEFT edge */}
          <motion.aside
            key="ai-panel"
            dir="rtl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-[min(380px,90vw)] flex flex-col bg-card/85 backdrop-blur-xl border-r border-border shadow-2xl shadow-black/60"
            role="dialog"
            aria-label="شبح AI"
          >
            {/* Header */}
            <header className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-border bg-background/60">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Ghost className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold leading-tight">شبح AI</span>
                {contextUrl ? (
                  <span className="text-[10px] text-muted-foreground truncate" title={contextUrl}>
                    {contextTitle || contextUrl}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">مساعد البحث المجهّل</span>
                )}
              </div>

              {contextUrl && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] text-primary">
                  <ExternalLink className="w-2.5 h-2.5" />
                  صفحة
                </span>
              )}

              <button
                type="button"
                onClick={() => clear()}
                disabled={messages.length === 0}
                aria-label="مسح المحادثة"
                title="مسح المحادثة"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Eraser className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => togglePanel(false)}
                aria-label="إغلاق اللوحة"
                title="إغلاق"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 shabah-scroll"
            >
              {messages.length === 0 && !loading && !error && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Ghost className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    اكتب سؤالك وسيُجيبك شبح AI مباشرة.
                    <br />
                    مساعد مجهّل — لا يُحفظ أيّ شيء.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}

              {loading && (
                <div className="flex justify-start" dir="rtl">
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-3.5 py-3">
                    <BouncingDots />
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={onSubmit}
              className="shrink-0 border-t border-border bg-background/60 p-3"
            >
              <div className="flex items-end gap-2 rounded-xl border border-border bg-card/60 focus-within:border-primary/50 transition-colors px-2 py-1.5">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="اكتب رسالتك… (Enter للإرسال، Shift+Enter لسطر جديد)"
                  dir="rtl"
                  disabled={loading}
                  className="flex-1 resize-none max-h-32 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60 py-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="إرسال"
                  title="إرسال"
                  className="shrink-0 rounded-lg w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
                مجهّل — غير مستخدم في التدريب
              </p>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
