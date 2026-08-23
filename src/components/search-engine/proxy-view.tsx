"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  RefreshCw,
  Shield,
  X,
  Home,
  Loader2,
} from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useTranslation } from "@/hooks/use-translation";

export function ProxyView() {
  const { proxyUrl, setProxyLoading, resetProxy, setView, reset } =
    useSearchStore();
  const incrementPages = usePrivacyStore((s) => s.incrementPages);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState(() => proxyUrl || "");
  const [history, setHistory] = useState<string[]>(() => proxyUrl ? [proxyUrl] : []);
  const [historyIdx, setHistoryIdx] = useState(() => proxyUrl ? 0 : -1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const initializedRef = useRef(!!proxyUrl);

  const buildSrc = (url: string) => 
    "/api/proxy-html?" + new URLSearchParams({ url }).toString();

  const navigateTo = useCallback(
    (url: string, addToHistory = true) => {
      if (!url) return;
      let finalUrl = url;
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = "https://www.google.com/search?igu=1&q=" + encodeURIComponent(url);
      }
      if (addToHistory) {
        setHistory((prev) => {
          const h = prev.slice(0, historyIdx + 1);
          h.push(finalUrl);
          setHistoryIdx(h.length - 1);
          return h;
        });
      }
      setUrlInput(finalUrl);
      setLoading(true);
      incrementPages();
    },
    [historyIdx, incrementPages],
  );

  const reload = () => {
    if (iframeRef.current && urlInput) {
      setLoading(true);
      iframeRef.current.src = buildSrc(urlInput);
    }
  };

  const goBack = () => {
    if (historyIdx > 0) {
      const i = historyIdx - 1;
      setHistoryIdx(i);
      setUrlInput(history[i]);
      setLoading(true);
    } else {
      resetProxy();
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const i = historyIdx + 1;
      setHistoryIdx(i);
      setUrlInput(history[i]);
      setLoading(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput.trim());
  };

  let domain = "";
  try {
    if (urlInput) domain = new URL(urlInput).hostname.replace(/^www\./, "");
  } catch {
    domain = urlInput || "";
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Browser chrome */}
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-2 h-11 px-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent text-foreground transition-colors"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <button onClick={goBack} disabled={historyIdx <= 0} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={goForward} disabled={historyIdx >= history.length - 1} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><polyline points="15 6 21 12 15 18" /></svg>
          </button>
          <button onClick={reload} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Shield className="w-3.5 h-3.5 text-primary/60 shrink-0" />

          <form onSubmit={handleSubmit} className="flex-1 min-w-0">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full h-8 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all dir-ltr text-left"
              dir="ltr"
              spellCheck={false}
              autoComplete="off"
            />
          </form>

          <button onClick={resetProxy} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {loading && (
          <div className="h-0.5 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary browser-loading-bar" />
          </div>
        )}
      </div>

      {/* Iframe */}
      <div className="flex-1 relative bg-white">
        {urlInput ? (
          <iframe
            ref={iframeRef}
            src={buildSrc(urlInput)}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-forms allow-popups"
            onLoad={() => setLoading(false)}
            title={domain}
          />
        ) : null}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">جارٍ التحميل...</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer backdrop */}
      <div
        className={["md:hidden fixed inset-0 z-50 transition-opacity duration-300", drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none", "bg-black/50 backdrop-blur-sm"].join(" ")}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className={["md:hidden fixed inset-y-0 left-0 z-50 w-56 flex flex-col bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-out", drawerOpen ? "translate-x-0" : "-translate-x-full"].join(" ")}
      >
        <div className="flex items-center justify-between p-3 border-b border-border h-12">
          <span className="text-sm font-bold text-primary">شبح</span>
          <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button onClick={() => { reset(); setDrawerOpen(false); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors">
            <Home className="w-4 h-4" />
            <span>{t("nav.home")}</span>
          </button>
          <button onClick={() => { resetProxy(); setDrawerOpen(false); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors">
            <ArrowRight className="w-4 h-4" />
            <span>{t("proxy.backToResults")}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
