import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory cache (per-process) for identical queries — reduces latency
// and avoids re-issuing the same search repeatedly. No persistent storage.
const cache = new Map<string, { at: number; data: any }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 min

function buildQuery(q: string, tab: string) {
  if (tab === "news") {
    return `${q} أخبار اليوم`;
  }
  if (tab === "images") {
    return `${q} صور`;
  }
  return q;
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const tab = (sp.get("tab") as "web" | "news" | "images") || "web";
  const num = Math.min(parseInt(sp.get("num") || "12", 10) || 12, 20);
  const recencyDays = sp.get("recency_days")
    ? parseInt(sp.get("recency_days") as string, 10)
    : undefined;

  if (!q) {
    return NextResponse.json(
      { error: "query (q) is required" },
      { status: 400 }
    );
  }

  const cacheKey = `${q}|${tab}|${num}|${recencyDays ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    metrics.recordSearch(true);
    return NextResponse.json({
      query: q,
      tab,
      cached: true,
      latencyMs: Date.now() - started,
      count: cached.data.length,
      results: cached.data,
    });
  }

  try {
    const zai = await getZai();
    const finalQuery = buildQuery(q, tab);

    const args: { query: string; num: number; recency_days?: number } = {
      query: finalQuery,
      num,
    };
    if (recencyDays) args.recency_days = recencyDays;

    const results = await zai.functions.invoke("web_search", args);

    // Normalize + lightly clean
    const clean = (Array.isArray(results) ? results : []).map(
      (r: any, i: number) => ({
        url: r.url || "",
        name: r.name || r.url || "",
        snippet: r.snippet || "",
        host_name: r.host_name || "",
        rank: r.rank ?? i + 1,
        date: r.date || "",
        favicon: r.favicon || "",
      })
    );

    cache.set(cacheKey, { at: Date.now(), data: clean });
    metrics.recordSearch(false);

    return NextResponse.json({
      query: q,
      tab,
      cached: false,
      latencyMs: Date.now() - started,
      count: clean.length,
      results: clean,
    });
  } catch (e: any) {
    console.error("[/api/search] error:", e);
    return NextResponse.json(
      { error: e?.message || "search failed" },
      { status: 500 }
    );
  }
}
