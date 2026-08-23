"use client";

import { useEffect, useRef, useCallback } from "react";
import { Search, Newspaper, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import { SearchBar } from "./search-bar";
import { ResultCard, ImageResultCard, ResultSkeleton } from "./result-card";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useAdminStore } from "@/store/admin-store";
import { useSettingsStore } from "@/store/settings-store";
import { matchBang, bangUrl } from "@/components/shabah/bangs";
import { useTranslation } from "@/hooks/use-translation";

// In-memory search cache
const searchCache = new Map<string, { results: any[]; ts: number }>();
const CACHE_TTL = 60_000;

function getCached(query: string, tab: string): any[] | null {
  const key = `${query}|${tab}`;
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.results;
}

function setCached(query: string, tab: string, results: any[]) {
  searchCache.set(`${query}|${tab}`, { results, ts: Date.now() });
}

type ResultTab = "web" | "news" | "images";

async function doSearch(query: string, tab: ResultTab, num: number) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("tab", tab);
  params.set("num", String(num));
  if (tab === "news") params.set("recency_days", "7");
  const res = await fetch(`/api/search?${params.toString()}`, { method: "GET" });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `فشل البحث (${res.status})`);
  }
  return res.json();
}

export function ResultsView() {
  const {
    query, tab, setTab, results, setResults, loading, setLoading, error, setError,
    setSummary, startProxy,
  } = useSearchStore();
  const incrementQueries = usePrivacyStore((s) => s.incrementQueries);
  const recordSearch = useAdminStore((s) => s.recordSearch);
  const bangsEnabled = useSettingsStore((s) => s.bangsEnabled);
  const ranFor = useRef("");
  const loadingMore = useRef(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const run = useCallback(async (q: string, tTab: ResultTab, num = 20, append = false) => {
    if (!q.trim()) return;

    if (!append) {
      const cached = getCached(q, tTab);
      if (cached && cached.length > 0) {
        setResults(cached);
        setError(null);
        setSummary(null);
        ranFor.current = `${q}|${tTab}|${cached.length}`;
        return;
      }
    }

    if (bangsEnabled && !append) {
      const bangMatch = matchBang(q);
      if (bangMatch) {
        const url = bangUrl(bangMatch.bang, bangMatch.query);
        startProxy(url, `${bangMatch.bang.label}: ${bangMatch.query}`);
        return;
      }
    }

    if (!append) setLoading(true);
    setError(null);
    setSummary(null);
    const key = `${q}|${tTab}|${num}`;
    ranFor.current = key;
    try {
      const data = await doSearch(q, tTab, num);
      const fetchedResults: any[] = data.results || [];
      if (append) {
        setResults([...results, ...fetchedResults]);
      } else {
        setResults(fetchedResults);
        setCached(q, tTab, fetchedResults);
      }
      incrementQueries();
      recordSearch(data.latencyMs || 0, data.cached === true, undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
      if (!append) setResults([]);
    } finally {
      setLoading(false);
      loadingMore.current = false;
    }
  }, [results, bangsEnabled, incrementQueries, recordSearch, setResults, setLoading, setError, setSummary, startProxy]);

  // Initial search
  useEffect(() => {
    if (query && results.length === 0 && !loading && !ranFor.current) {
      const cached = getCached(query, tab);
      if (cached && cached.length > 0) {
        setResults(cached);
        ranFor.current = `${query}|${tab}|${cached.length}`;
      } else {
        run(query, tab);
      }
    }
  }, []);

  // Tab change
  useEffect(() => {
    if (query && ranFor.current !== `${query}|${tab}|${results.length}`) {
      run(query, tab);
    }
  }, [tab]);

  // Re-search event
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail as string;
      if (q) run(q, tab);
    };
    window.addEventListener("onionsearch:submit", handler);
    return () => window.removeEventListener("onionsearch:submit", handler);
  }, [tab, run]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loading || loadingMore.current) return;
    loadingMore.current = true;
    run(query, tab, results.length + 20, true);
  }, [loading, query, tab, results.length, run]);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    observerRef.current?.disconnect();
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observerRef.current = obs;
    if (node) obs.observe(node);
  }, [loading, loadMore]);

  return (
    <main className="flex-1 w-full">
      {/* Top bar with search — Google style */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-[720px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => useSearchStore.getState().reset()}
            className="shrink-0 text-primary hover:opacity-80 transition-opacity"
            aria-label={t("nav.homeTitle")}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" />
              <text x="16" y="21" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold">ش</text>
            </svg>
          </button>
          <div className="flex-1">
            <SearchBar variant="compact" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="max-w-[720px] mx-auto px-4 flex items-center gap-1">
          {(["web", "news", "images"] as const).map((t) => {
            const icons = { web: Search, news: Newspaper, images: ImageIcon };
            const labels: Record<string, string> = { web: t("results.tabWeb"), news: t("results.tabNews"), images: t("results.tabImages") };
            const Icon = icons[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors ${tab === t ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{labels[t]}</span>
              </button>
            );
          })}
          {results.length > 0 && (
            <span className="mr-auto text-xs text-muted-foreground py-2.5">
              {t("results.aboutCount", { count: results.length, query })}
            </span>
          )}
        </div>
      </div>

      {/* Results area — Google-like centered column */}
      <div className="max-w-[720px] mx-auto px-4 py-4">
        {error ? (
          <div className="flex items-start gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : results.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("results.noResults")}</p>
        ) : tab === "images" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.map((item, i) => (
              <ImageResultCard key={item.url + i} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div>
            {results.map((item, i) => (
              <ResultCard key={item.url + i} item={item} index={i} />
            ))}
          </div>
        )}

        {/* Loading states */}
        {loading && results.length === 0 && (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <ResultSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Load more sentinel */}
        {results.length > 0 && !loading && (
          <div ref={sentinelRef} className="py-8 flex items-center justify-center">
            {loadingMore.current && (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            )}
          </div>
        )}

        {/* Loading more indicator */}
        {loading && results.length > 0 && (
          <div className="py-4 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">{t("results.loadingMore")}</span>
          </div>
        )}
      </div>
    </main>
  );
}
