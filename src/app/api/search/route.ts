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

// ── Brave Search API (free tier — works on Vercel) ──
async function searchBrave(query: string, num: number): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      count: String(Math.min(num, 20)),
    });
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[Brave API] ${res.status}`);
      return [];
    }
    const data = await res.json();
    const webResults = data.web?.results || [];
    return webResults.map((r: any, i: number) => {
      const url = r.url || "";
      let hostName = "";
      try { hostName = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      return {
        url,
        name: r.title || url,
        snippet: r.description || "",
        host_name: hostName,
        rank: i,
        date: r.age || "",
        favicon: r.thumbnail?.src || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostName)}&sz=32`,
      };
    });
  } catch (e) {
    console.error("[Brave search error]", e);
    return [];
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
    // 1) Try SDK first (local dev)
    const sdkResults = await searchSDK(tab === "news" ? `${q} أخبار اليوم` : tab === "images" ? `${q} صور` : q, num);
    if (sdkResults && sdkResults.length > 0) {
      cache.set(cacheKey, { at: Date.now(), data: sdkResults });
      return NextResponse.json({
        query: q, tab, cached: false, source: "shabah",
        latencyMs: Date.now() - started,
        count: sdkResults.length, results: sdkResults,
      });
    }

    // 2) Try Brave Search API (Vercel compatible)
    const braveResults = await searchBrave(tab === "news" ? `${q} news` : q, num);
    if (braveResults.length > 0) {
      cache.set(cacheKey, { at: Date.now(), data: braveResults });
      return NextResponse.json({
        query: q, tab, cached: false, source: "brave",
        latencyMs: Date.now() - started,
        count: braveResults.length, results: braveResults,
      });
    }

    // 3) No results
    const hasBraveKey = !!process.env.BRAVE_API_KEY;
    return NextResponse.json({
      query: q, tab, cached: false, source: "none",
      needsBraveKey: !hasBraveKey,
      latencyMs: Date.now() - started,
      count: 0, results: [],
    });
  } catch (e: any) {
    console.error("[/api/search] error:", e);
    return NextResponse.json({ error: e?.message || "search failed" }, { status: 500 });
  }
}
