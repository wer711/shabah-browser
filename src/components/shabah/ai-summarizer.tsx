"use client";

import { useEffect, useRef, Fragment } from "react";
import { Ghost, X, Sparkles, AlertCircle } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { useSettingsStore } from "@/store/settings-store";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicNumeral(n: number): string {
  return n
    .toString()
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)])
    .join("");
}

function parseArabicInt(s: string): number | null {
  let n = 0;
  for (const ch of s) {
    const wi = ARABIC_DIGITS.indexOf(ch);
    if (wi >= 0) {
      n = n * 10 + wi;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      n = n * 10 + (ch.charCodeAt(0) - 48);
      continue;
    }
    return null;
  }
  return n;
}

/**
 * Split the reply text into text segments + citation markers, then render
 * each citation as a clickable superscript button that opens the
 * corresponding result via the search-store `startProxy` flow.
 */
function renderWithCitations(
  text: string,
  results: { url: string; name: string }[],
  onCite: (idx: number) => void
) {
  const out: React.ReactNode[] = [];
  const re = /\[([0-9\u0660-\u0669]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(<Fragment key={`t${key++}`}>{text.slice(last, m.index)}</Fragment>);
    }
    const num = parseArabicInt(m[1]);
    if (num !== null && num >= 1 && num <= results.length) {
      const item = results[num - 1];
      out.push(
        <button
          key={`c${key++}`}
          type="button"
          onClick={() => onCite(num - 1)}
          title={`فتح: ${item.url}`}
          className="mx-0.5 inline-flex items-center align-super text-[0.7em] font-mono rounded-md px-1 py-0.5 border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 transition-colors"
        >
          [{toArabicNumeral(num)}]
        </button>
      );
    } else {
      // Out-of-range citation — render as plain text, don't make it clickable.
      out.push(<Fragment key={`c${key++}`}>[{m[1]}]</Fragment>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(<Fragment key={`t${key++}`}>{text.slice(last)}</Fragment>);
  }
  return out;
}

function Shimmer() {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden>
      <div className="h-3 w-full bg-muted/60 rounded" />
      <div className="h-3 w-11/12 bg-muted/50 rounded" />
      <div className="h-3 w-9/12 bg-muted/40 rounded" />
      <div className="flex gap-1.5 mt-2">
        <div className="h-5 w-8 bg-primary/15 rounded" />
        <div className="h-5 w-8 bg-primary/15 rounded" />
        <div className="h-5 w-8 bg-primary/15 rounded" />
      </div>
    </div>
  );
}

export function AiSummarizer() {
  const aiSummarizerEnabled = useSettingsStore((s) => s.aiSummarizer);
  const {
    query,
    results,
    summary,
    summarySources,
    summaryLoading,
    setSummary,
    setSummaryLoading,
    startProxy,
  } = useSearchStore();

  // Track which (query, results-set) we have already fetched / attempted
  // for, so we don't refetch on every keystroke or store update.
  const fetchedForRef = useRef<string | null>(null);

  // Reset fetched-marker when there are no results (e.g., new search started).
  useEffect(() => {
    if (results.length === 0) {
      fetchedForRef.current = null;
    }
  }, [results.length]);

  // Fire the summarizer once per (query + result set) when:
  //  - aiSummarizer setting is enabled
  //  - results have arrived (≥ 2)
  //  - summary is null (not yet fetched AND not dismissed)
  //  - we haven't already fetched for this exact set
  useEffect(() => {
    if (!aiSummarizerEnabled) return;
    if (results.length < 2) return;
    if (!query.trim()) return;
    if (summary !== null) return; // already have one (or user dismissed → "")

    const key = `${query}|${results[0]?.url ?? ""}|${results.length}`;
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    let cancelled = false;
    setSummaryLoading(true);

    (async () => {
      try {
        const top = results.slice(0, 5).map((r) => ({
          name: r.name,
          snippet: r.snippet,
          url: r.url,
          host_name: r.host_name,
        }));
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, results: top }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `(${res.status})`);
        }
        const data = (await res.json()) as {
          reply?: string;
          sources?: { title: string; url: string }[];
        };
        if (cancelled) return;
        if (data.reply && data.reply.trim()) {
          setSummary(data.reply, data.sources || []);
        } else {
          // Empty reply → treat as dismissed to avoid retry storm.
          setSummary("", []);
        }
      } catch {
        if (cancelled) return;
        // Mark as handled (empty string) so we don't retry on every render.
        setSummary("", []);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [results, aiSummarizerEnabled]);

  // Respect the user's settings toggle.
  if (!aiSummarizerEnabled) return null;
  // Hide while a search is loading (results are stale).
  if (results.length < 2) return null;
  // Hide once dismissed (summary === "").
  if (summary === "") return null;
  // Nothing to show yet AND not loading → don't render the shell.
  if (!summary && !summaryLoading) return null;

  const handleCite = (idx: number) => {
    const item = results[idx];
    if (item?.url) startProxy(item.url, item.name);
  };

  return (
    <section
      dir="rtl"
      className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-lg shadow-black/20 overflow-hidden"
      aria-label="موجز شبح AI"
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      <div className="relative flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Ghost className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-sm font-bold text-primary inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              موجز شبح AI
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono">
              · {summarySources.length || 0} مصدر
            </span>
          </div>

          {summaryLoading && !summary ? (
            <Shimmer />
          ) : summary ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              {renderWithCitations(summary, results, handleCite)}
            </p>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5" />
              لا يوجد موجز.
            </div>
          )}

          {summarySources.length > 0 && !summaryLoading && (
            <ul className="mt-3 pt-3 border-t border-border/60 flex flex-col gap-1.5">
              {summarySources.map((s, i) => (
                <li key={`${s.url}-${i}`} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-mono text-primary/80 text-[10px] shrink-0">
                    [{toArabicNumeral(i + 1)}]
                  </span>
                  <button
                    type="button"
                    onClick={() => startProxy(s.url, s.title)}
                    title={s.url}
                    className="truncate text-right hover:text-primary hover:underline transition-colors"
                  >
                    {s.title || s.url}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSummary("", [])}
          aria-label="إغلاق الموجز"
          title="إغلاق الموجز"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
