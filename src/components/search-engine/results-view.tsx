"use client";

import { useEffect, useRef } from "react";
import { Search, Newspaper, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "./search-bar";
import { ResultCard, ResultSkeleton } from "./result-card";
import { useSearchStore, type ResultTab } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useAdminStore } from "@/store/admin-store";
import { PrivacyPanel } from "./privacy-panel";
import { AiSummarizer } from "@/components/shabah/ai-summarizer";
import { matchBang, bangUrl } from "@/components/shabah/bangs";
import { useSettingsStore } from "@/store/settings-store";
import { useTranslation } from "@/hooks/use-translation";

// ---- In-memory search cache (wiped on refresh, never persisted) ----
const searchCache = new Map<string, { results: any[]; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

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

async function doSearch(query: string, tab: ResultTab) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("tab", tab);
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
    query,
    tab,
    setTab,
    results,
    setResults,
    loading,
    setLoading,
    error,
    setError,
    setSummary,
    startProxy,
  } = useSearchStore();
  const incrementQueries = usePrivacyStore((s) => s.incrementQueries);
  const recordSearch = useAdminStore((s) => s.recordSearch);
  const bangsEnabled = useSettingsStore((s) => s.bangsEnabled);
  const ranFor = useRef<string>("");
  const { t } = useTranslation();

  const run = async (q: string, tTab: ResultTab) => {
    if (!q.trim()) return;

    // Check in-memory cache first
    const cached = getCached(q, tTab);
    if (cached && cached.length > 0) {
      setResults(cached);
      setError(null);
      setSummary(null);
      ranFor.current = `${q}|${tTab}`;
      return;
    }

    if (bangsEnabled) {
      const bangMatch = matchBang(q);
      if (bangMatch) {
        const url = bangUrl(bangMatch.bang, bangMatch.query);
        startProxy(url, `${bangMatch.bang.label}: ${bangMatch.query}`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    ranFor.current = `${q}|${tTab}`;
    try {
      const data = await doSearch(q, tTab);
      const fetchedResults = data.results || [];
      setResults(fetchedResults);
      setCached(q, tTab, fetchedResults);
      incrementQueries();
      recordSearch(data.latencyMs || 0, data.cached === true, undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query && results.length === 0 && !loading && !ranFor.current) {
      const cached = getCached(query, tab);
      if (cached && cached.length > 0) {
        setResults(cached);
        ranFor.current = `${query}|${tab}`;
      } else {
        run(query, tab);
      }
    }
  }, []);

  useEffect(() => {
    if (query && ranFor.current !== `${query}|${tab}`) {
      run(query, tab);
    }
  }, [tab]);

  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail as string;
      if (q) run(q, tab);
    };
    window.addEventListener("onionsearch:submit", handler);
    return () => window.removeEventListener("onionsearch:submit", handler);
  }, [tab]);

  return (
    <main className="flex-1 w-full">
      {/* Top search bar (sticky) */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2 shrink-0 sm:w-44">
              <LogoMark />
              <span className="font-bold text-base hidden sm:inline">
                <span className="text-primary">ش</span>بح
              </span>
            </div>
            <div className="flex-1 max-w-2xl">
              <SearchBar variant="compact" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Results column */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  {t("results.routing")}
                </span>
              ) : error ? (
                <span className="text-destructive inline-flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </span>
              ) : (
                <span>
                  {t("results.aboutCount", { count: results.length, query })}
                </span>
              )}
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as ResultTab)}
            className="mb-4"
          >
            <TabsList className="bg-card/60 border border-border">
              <TabsTrigger value="web" className="gap-1.5">
                <Search className="w-3.5 h-3.5" />
                {t("results.tabWeb")}
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                {t("results.tabNews")}
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                {t("results.tabImages")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* AI Summarizer block */}
          {!loading && !error && results.length >= 2 && (
            <div className="mb-4">
              <AiSummarizer />
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ResultSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("results.noResults")}
              </p>
            </div>
          ) : tab === "images" ? (
            <ImagesGrid items={results} />
          ) : (
            <div className="space-y-2.5">
              {results.map((item, i) => (
                <ResultCard key={item.url + i} item={item} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: privacy panel */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <PrivacyPanel />
          <div className="rounded-xl border border-border bg-card/40 p-3 text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">{t("results.infoTitle")}</p>
            {t("results.infoText")}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ImagesGrid({ items }: { items: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((it, i) => (
        <a
          key={it.url + i}
          href={it.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group rounded-xl border border-border bg-card/40 overflow-hidden hover:border-primary/40 transition-colors"
        >
          <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(it.host_name || it.url)}&sz=128`}
              alt={it.name}
              className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="p-2">
            <div className="text-xs font-medium line-clamp-1">{it.name}</div>
            <div className="text-[10px] text-muted-foreground line-clamp-1 dir-ltr">
              {it.host_name}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
      <span className="text-primary text-xs font-bold">ش</span>
    </div>
  );
}
