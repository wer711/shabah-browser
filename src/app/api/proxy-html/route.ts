import { NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory cache of fetched HTML pages (keyed by URL).
const cache = new Map<string, { at: number; html: string; bytesStripped: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

/** Strip tracking scripts, ads, event handlers, javascript: URIs, tracking pixels. */
function sanitizeHtml(html: string): { html: string; bytesStripped: number } {
  if (!html) return { html: "", bytesStripped: 0 };
  const originalLen = Buffer.byteLength(html, "utf8");

  let out = html;

  // Remove <script> blocks entirely
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // Remove <iframe> (prevents cross-origin tracking / nested ads)
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  // Remove <object>/<embed>
  out = out.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "");
  out = out.replace(/<embed\b[^>]*\/?>/gi, "");
  // Remove noscript
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  // Strip inline event handlers (on*)
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Strip javascript: URIs
  out = out.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, "");
  // Strip data: URIs in src (avoid data exfiltration)
  out = out.replace(/(src)\s*=\s*["']data:[^"']*["']/gi, "");

  // Remove common tracking pixels (1x1 images from known trackers)
  out = out.replace(/<img\b[^>]*\bheight\s*=\s*["']1["'][^>]*>/gi, "");
  out = out.replace(/<img\b[^>]*\bwidth\s*=\s*["']1["'][^>]*>/gi, "");

  const newLen = Buffer.byteLength(out, "utf8");
  return { html: out, bytesStripped: Math.max(0, originalLen - newLen) };
}

/**
 * Inject a <base href="..."> tag right after <head> so relative URLs
 * (images, CSS, links) resolve against the original page URL.
 */
function injectBaseTag(html: string, originalUrl: string): string {
  // Insert after <head> (with optional attributes/whitespace)
  return html.replace(
    /(<head\b[^>]*>)/i,
    `$1<base href="${originalUrl}">`
  );
}

/**
 * Rewrite <a href="..."> links so navigation stays within the proxy.
 * Converts absolute and scheme-relative URLs to proxy URLs.
 * Leaves fragment-only (#), javascript:, mailto:, tel:, and data: links untouched.
 */
function rewriteLinks(html: string): string {
  return html.replace(
    /<a\b([^>]*?)\s+href\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, href: string) => {
      const trimmed = href.trim();

      // Skip non-http links
      if (
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("javascript:") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:") ||
        trimmed.startsWith("data:")
      ) {
        return `<a${attrs} href=${quote}${href}${quote}`;
      }

      // Resolve scheme-relative (//example.com/path) or relative paths
      // The <base> tag handles relative URLs, but we still need to
      // intercept navigation. For absolute URLs, rewrite to proxy.
      // For relative URLs, we also rewrite so the proxy intercepts them.
      const proxyUrl = `/api/proxy-html?url=${encodeURIComponent(trimmed)}`;
      return `<a${attrs} href=${quote}${proxyUrl}${quote}`;
    }
  );
}

/** Security headers for proxied HTML responses. */
const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline' *; img-src * data:; font-src *; connect-src 'self' *; frame-src 'self'; object-src 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/** Build a minimal HTML error page in Arabic RTL. */
function errorPage(message: string, status: number): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>خطأ ${status} — شبح</title>
  <style>
    body { font-family: Alexandria, Tajawal, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #e5e5e5; }
    .box { text-align: center; padding: 2rem; max-width: 28rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.75rem; color: #ef4444; }
    p { color: #a3a3a3; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>خطأ ${status}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...SECURITY_HEADERS,
    },
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawUrl = sp.get("url")?.trim();

  // Validate URL parameter
  if (!rawUrl) {
    return errorPage('المعلمة \"url\" مطلوبة.', 400);
  }
  if (!/^https?:\/\//i.test(rawUrl)) {
    return errorPage("يجب أن يبدأ الرابط بـ http:// أو https://.", 400);
  }

  // Check cache
  const cached = cache.get(rawUrl);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    metrics.recordProxy(true, cached.bytesStripped);
    return new NextResponse(cached.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Cache": "HIT",
        ...SECURITY_HEADERS,
      },
    });
  }

  try {
    // Fetch the page directly with native fetch (fast, no AI processing)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404)
        return errorPage("الصفحة غير موجودة (404).", 404);
      if (res.status === 403)
        return errorPage("الموقع يرفض الوصول (403). جرّب دورة عُقد جديدة.", 403);
      if (res.status === 500 || res.status === 502 || res.status === 503)
        return errorPage(`خطأ من الخادم البعيد (${res.status}). حاول لاحقاً.`, 502);
      return errorPage(`فشل جلب الصفحة (HTTP ${res.status}).`, 502);
    }

    const contentType = res.headers.get("content-type") || "";
    let rawHtml = await res.text();

    // If the response isn't HTML, return an error
    if (
      !contentType.includes("text/html") &&
      !rawHtml.trim().startsWith("<!") &&
      !rawHtml.trim().startsWith("<html")
    ) {
      return errorPage("المحتوى ليس صفحة HTML.", 400);
    }

    // 1. Sanitize: remove scripts, iframes, objects, embeds, event handlers, etc.
    const { html: sanitized, bytesStripped } = sanitizeHtml(rawHtml);

    // 2. Inject <base href> so relative URLs resolve correctly
    const withBase = injectBaseTag(sanitized, rawUrl);

    // 3. Rewrite <a href> links to route through our proxy
    const withRewrites = rewriteLinks(withBase);

    // Cache the processed HTML
    cache.set(rawUrl, {
      at: Date.now(),
      html: withRewrites,
      bytesStripped,
    });

    metrics.recordProxy(false, bytesStripped);

    return new NextResponse(withRewrites, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Cache": "MISS",
        ...SECURITY_HEADERS,
      },
    });
  } catch (e: any) {
    console.error("[/api/proxy-html] error:", e);
    const msg = (e?.message || "fetch failed").toLowerCase();
    if (msg.includes("abort") || msg.includes("timeout") || msg.includes("timed out"))
      return errorPage("انتهت مهلة الاتصال بالموقع.", 504);
    return errorPage("حدث خطأ أثناء جلب الصفحة.", 502);
  }
}
