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

// ── Brave Search API (if key available) ──
async function searchBrave(query: string, num: number): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({ q: query, count: String(Math.min(num, 20)) });
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.web?.results || []).map((r: any, i: number) => {
      const url = r.url || "";
      let hostName = "";
      try { hostName = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      return { url, name: r.title || url, snippet: r.description || "", host_name: hostName, rank: i, date: r.age || "", favicon: r.thumbnail?.src || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostName)}&sz=32` };
    });
  } catch { return []; }
}

// ── Bing HTML scraper (free, unlimited, works on Vercel) ──
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

async function searchBing(query: string, num: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${num}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        "Accept-Encoding": "identity",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Split by Bing result blocks
    const algoRegex = /<li[^>]*class="b_algo"[^>]*>/gi;
    const parts = html.split(algoRegex);

    for (const part of parts) {
      if (results.length >= num) break;

      // Find the first external link (skip bing.com, microsoft.com, /ck/a tracking)
      const allLinks = [...part.matchAll(/<a[^>]+href="([^"]+)"[^>]*>/gi)];
      let linkUrl = "";
      for (const m of allLinks) {
        const href = m[1];
        if (href.includes("bing.com/") || href.includes("microsoft.com/") || href.startsWith("#") || href.startsWith("javascript:") || href.includes("/ck/a?")) continue;
        linkUrl = href;
        break;
      }
      if (!linkUrl) continue;

      // Extract title from <h2> or <a> with strong text
      let title = "";
      const h2Match = part.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      if (h2Match) title = stripHtml(h2Match[1]);
      if (!title) {
        const aTitleMatch = part.match(/<a[^>]+href="[^"]+"[^>]*>([\s\S]*?)<\/a>/i);
        if (aTitleMatch) title = stripHtml(aTitleMatch[1]);
      }
      if (!title || title.length < 2) continue;

      // Extract snippet from <p> inside b_caption
      let snippet = "";
      const pMatch = part.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch) snippet = stripHtml(pMatch[1]);

      let hostName = "";
      try { hostName = new URL(linkUrl).hostname.replace(/^www\./, ""); } catch {}

      results.push({
        url: linkUrl, name: title, snippet, host_name: hostName,
        rank: results.length, date: "",
        favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostName)}&sz=32`,
      });
    }

    return results;
  } catch (e) {
    console.error("[Bing search error]", e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const tab = (sp.get("tab") as "web" | "news" | "images") || "web";
  const num = Math.min(parseInt(sp.get("num") || "20", 10) || 20, 50);

  if (!q) return NextResponse.json({ error: "query (q) is required" }, { status: 400 });

  const cacheKey = `${q}|${tab}|${num}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({ query: q, tab, cached: true, latencyMs: Date.now() - started, count: cached.data.length, results: cached.data });
  }

  try {
    // 1) SDK (local dev)
    const searchQ = tab === "news" ? `${q} أخبار اليوم` : tab === "images" ? `${q} صور` : q;
    const sdkResults = await searchSDK(searchQ, num);
    if (sdkResults && sdkResults.length > 0) {
      cache.set(cacheKey, { at: Date.now(), data: sdkResults });
      return NextResponse.json({ query: q, tab, cached: false, source: "shabah", latencyMs: Date.now() - started, count: sdkResults.length, results: sdkResults });
    }

    // 2) Brave (if API key set)
    const braveResults = await searchBrave(tab === "news" ? `${q} news` : q, num);
    if (braveResults.length > 0) {
      cache.set(cacheKey, { at: Date.now(), data: braveResults });
      return NextResponse.json({ query: q, tab, cached: false, source: "brave", latencyMs: Date.now() - started, count: braveResults.length, results: braveResults });
    }

    // 3) Bing scraper (free, unlimited, always works)
    const bingResults = await searchBing(tab === "news" ? `${q} news` : q, num);
    if (bingResults.length > 0) {
      cache.set(cacheKey, { at: Date.now(), data: bingResults });
      return NextResponse.json({ query: q, tab, cached: false, source: "bing", latencyMs: Date.now() - started, count: bingResults.length, results: bingResults });
    }

    return NextResponse.json({ query: q, tab, cached: false, source: "none", latencyMs: Date.now() - started, count: 0, results: [] });
  } catch (e: any) {
    console.error("[/api/search] error:", e);
    return NextResponse.json({ error: e?.message || "search failed" }, { status: 500 });
  }
}
