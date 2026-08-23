import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cache for non-HTML resources
const cache = new Map<string, { at: number; data: ArrayBuffer; contentType: string }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 min for static resources

// Tracking domains to block entirely
const BLOCKED_DOMAINS = [
  "google-analytics.com", "googletagmanager.com", "doubleclick.net",
  "facebook.net", "connect.facebook.net", "adsense", "pagead",
  "quantserve.com", "scorecardresearch.com", "hotjar.com", "clarity.ms",
  "mixpanel.com", "segment.io", "amplitude.com", "pixel", "beacon",
  "adservice", ".ads.", ".ad.", "adservice.google",
];

function isBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
}

const PROXY_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "X-Content-Type-Options": "nosniff",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PROXY_HEADERS });
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url")?.trim();

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Block tracking
  if (isBlocked(rawUrl)) {
    return new NextResponse("", { status: 204 });
  }

  // Check cache
  const cached = cache.get(rawUrl);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return new NextResponse(cached.data, {
      headers: {
        "Content-Type": cached.contentType,
        "X-Cache": "HIT",
        "Cache-Control": "public, max-age=3600",
        ...PROXY_HEADERS,
      },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        DNT: "1",
        "Sec-GPC": "1",
        Referer: rawUrl,
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return new NextResponse(`Upstream ${res.status}`, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const data = await res.arrayBuffer();

    // Cache non-large resources
    if (data.byteLength < 5 * 1024 * 1024) {
      cache.set(rawUrl, { at: Date.now(), data, contentType });
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=3600",
        ...PROXY_HEADERS,
      },
    });
  } catch (e: any) {
    console.error("[/api/proxy-html/r] error:", e.message);
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
