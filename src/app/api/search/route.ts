import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = new Map<string, { at: number; data: any }>();
const CACHE_TTL = 1000 * 60 * 5;

interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

// ── z-ai-web-dev-sdk (local dev only) ──
let sdkOk: boolean | null = null;
let sdk: any = null;

async function searchSDK(query: string, num: number): Promise<SearchResult[] | null> {
  if (sdkOk === false) return null;
  try {
    if (!sdk) {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      sdk = await ZAI.create();
      sdkOk = true;
    }
    const results = await sdk.functions.invoke("web_search", { query, num });
    return (Array.isArray(results) ? results : []).map((r: any, i: number) => ({
      url: r.url || "",
      name: r.name || r.url || "",
      snippet: r.snippet || "",
      host_name: r.host_name || "",
      rank: i,
      date: r.date || "",
      favicon: r.favicon || "",
    }));
  } catch {
    sdkOk = false;
    return null;
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const tab = (sp.get("tab") as "web" | "news" | "images") || "web";
  const num = Math.min(parseInt(sp.get("num") || "20", 10) || 20, 50);

  if (!q) {
    return NextResponse.json({ error: "query (q) is required" }, { status: 400 });
  }

  const cacheKey = `${q}|${tab}|${num}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({
      query: q, tab, cached: true, latencyMs: Date.now() - started,
      count: cached.data.length, results: cached.data,
    });
  }

  try {
    // Try SDK
    const sdkResults = await searchSDK(tab === "news" ? `${q} أخبار اليوم` : tab === "images" ? `${q} صور` : q, num);
    if (sdkResults && sdkResults.length > 0) {
      cache.set(cacheKey, { at: Date.now(), data: sdkResults });
      return NextResponse.json({
        query: q, tab, cached: false, source: "shabah",
        latencyMs: Date.now() - started,
        count: sdkResults.length, results: sdkResults,
      });
    }

    // SDK unavailable — return empty with flag so frontend can redirect
    return NextResponse.json({
      query: q, tab, cached: false, source: "redirect",
      latencyMs: Date.now() - started,
      count: 0, results: [],
    });
  } catch (e: any) {
    console.error("[/api/search] error:", e);
    return NextResponse.json({ error: e?.message || "search failed" }, { status: 500 });
  }
}
