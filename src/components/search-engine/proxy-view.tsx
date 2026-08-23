"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  RefreshCw,
  Shield,
  X,
  Home,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Globe,
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
  const [pageTitle, setPageTitle] = useState("");
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
        // Try as search query
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
      setPageTitle("");
      setLoading(true);
      incrementPages();
    },
    [historyIdx, incrementPages],
  );

  // Listen for postMessage from iframe (navigation interceptor)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "shabah-navigate" && e.data.url) {
        navigateTo(e.data.url);
      }
      if (e.data?.type === "shabah-title" && e.data.title) {
        setPageTitle(e.data.title);
      }
      if (e.data?.type === "shabah-go-back") {
        resetProxy();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigateTo, resetProxy]);

  const reload = () => {
    if (iframeRef.current && urlInput) {
      setLoading(true);
      // Add cache-buster
      const sep = urlInput.includes("?") ? "&" : "?";
      iframeRef.current.src = buildSrc(urlInput) + "&_t=" + Date.now();
    }
  };

  const goBack = () => {
    if (historyIdx > 0) {
      const i = historyIdx - 1;
      setHistoryIdx(i);
      setUrlInput(history[i]);
      setPageTitle("");
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
      setPageTitle("");
      setLoading(true);
    }
  };

  const openExternal = () => {
    if (urlInput) window.open(urlInput, "_blank", "noopener,noreferrer");
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
      {/* Browser chrome bar */}
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-1.5 h-11 px-1.5">
          {/* Menu button (mobile) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent text-foreground transition-colors"
            aria-label="القائمة"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Back */}
          <button
            onClick={goBack}
            disabled={historyIdx <= 0}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Forward */}
          <button
            onClick={goForward}
            disabled={historyIdx >= history.length - 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="تقدم"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><polyline points="15 6 21 12 15 18" /></svg>
          </button>

          {/* Reload */}
          <button
            onClick={reload}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="إعادة تحميل"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Shield icon */}
          <Shield className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" title="محمي عبر شبح" />

          {/* URL bar */}
          <form onSubmit={handleSubmit} className="flex-1 min-w-0">
            <div className="relative">
              <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full h-8 pr-8 pl-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                dir="ltr"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </form>

          {/* Open externally */}
          <button
            onClick={openExternal}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="فتح في تبويب جديد"
            title="فتح في تبويب جديد"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={resetProxy}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Page title bar */}
        {pageTitle && !loading && (
          <div className="px-3 py-1 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50">
            <Shield className="w-3 h-3 text-emerald-500/50" />
            <span className="truncate">{pageTitle}</span>
          </div>
        )}

        {/* Loading bar */}
        {loading && (
          <div className="h-0.5 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary browser-loading-bar" />
          </div>
        )}
      </div>

      {/* Iframe content */}
      <div className="flex-1 relative bg-white">
        {urlInput ? (
          <iframe
            ref={iframeRef}
            src={buildSrc(urlInput)}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-popups-to-escape-sandbox"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            title={domain}
          />
        ) : null}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">جارٍ التحميل عبر شبح...</span>
              <span className="text-xs text-muted-foreground/60 dir-ltr">{domain}</span>
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
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-primary">شبح</span>
          </div>
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
          <hr className="border-border my-2" />
          <button onClick={() => { reload(); setDrawerOpen(false); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>إعادة تحميل</span>
          </button>
          <button onClick={() => { openExternal(); setDrawerOpen(false); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span>فتح في تبويب جديد</span>
          </button>
          <button onClick={() => { resetProxy(); setDrawerOpen(false); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors">
            <AlertTriangle className="w-4 h-4" />
            <span>الإبلاغ عن مشكلة</span>
          </button>
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
            <Shield className="w-3 h-3" />
            <span>محمي بتشفير شبح</span>
          </div>
        </div>
      </div>
    </div>
  );
}
