import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = new Map<string, { at: number; data: any }>();
const CACHE_TTL = 1000 * 60 * 15;

function sanitizeHtml(html: string): { html: string; bytesStripped: number } {
  if (!html) return { html: "", bytesStripped: 0 };
  const originalLen = Buffer.byteLength(html, "utf8");
  let out = html;

  // Remove dangerous elements but KEEP scripts needed for SPAs when possible
  // Remove tracking/ad scripts only
  out = out.replace(/<script\b[^>]*(?:google-analytics|googletagmanager|facebook|doubleclick|adsense|adsbygoogle|pagead|quantserve|scorecardresearch|hotjar|clarity\.ms|mixpanel|segment|amplitude|pinimg|connect\.facebook)[^>]*>[\s\S]*?<\/script>/gi, "");
  // Remove tracking pixels
  out = out.replace(/<img\b[^>]*\b(?:height\s*=\s*["']?1["']?|width\s*=\s*["']?1["']?|tracking|pixel|beacon)[^>]*>/gi, "");
  // Remove inline tracking event handlers
  out = out.replace(/\s(onload|onerror|onbeforeunload)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Remove known tracking URLs in img src
  out = out.replace(/<img\b[^>]*src\s*=\s*["'](https?:\/\/(?:www\.)?(?:google-analytics|facebook|doubleclick|adsense|quantserve|scorecardresearch)[^"']+)["'][^>]*>/gi, "");

  const newLen = Buffer.byteLength(out, "utf8");
  return { html: out, bytesStripped: Math.max(0, originalLen - newLen) };
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url")?.trim();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "url must start with http(s)://" }, { status: 400 });
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({
      url, cached: true, latencyMs: Date.now() - started,
      ...cached.data,
    });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        // Privacy headers
        "DNT": "1",
        "Sec-GPC": "1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const rawHtml = await res.text();

    // Extract title from HTML
    const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract published time from meta tags
    const dateMatch = rawHtml.match(/<meta[^>]*(?:article:published_time|datePublished|pubdate)[^>]*content\s*=\s*["']([^"']+)["']/i);
    const publishedTime = dateMatch?.[1] || "";

    const { html: sanitized, bytesStripped } = sanitizeHtml(rawHtml);

    const payload = {
      url, title,
      html: sanitized,
      publishedTime,
      bytesSaved: bytesStripped,
    };

    cache.set(url, { at: Date.now(), data: payload });

    return NextResponse.json({
      url, cached: false, latencyMs: Date.now() - started,
      ...payload,
    });
  } catch (e: any) {
    console.error("[/api/proxy] error:", e);
    const msg = (e?.message || "fetch failed").toLowerCase();
    if (msg.includes("404")) return NextResponse.json({ error: "الصفحة غير موجودة (404)." }, { status: 502 });
    if (msg.includes("403") || msg.includes("forbidden")) return NextResponse.json({ error: "الموقع يرفض الوصول (403)." }, { status: 502 });
    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("abort")) return NextResponse.json({ error: "انتهت مهلة الاتصال بالموقع." }, { status: 504 });
    return NextResponse.json({ error: e?.message || "fetch failed" }, { status: 502 });
  }
}
