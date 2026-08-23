import { NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cache
const cache = new Map<string, { at: number; html: string; bytesStripped: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 min

// Tracking domains to block
const BLOCKED_DOMAINS = [
  "google-analytics.com", "googletagmanager.com", "doubleclick.net",
  "facebook.net", "facebook.com", "connect.facebook.net",
  "adsense", "pagead", "quantserve.com", "scorecardresearch.com",
  "hotjar.com", "clarity.ms", "mixpanel.com", "segment.io",
  "amplitude.com", "pinimg.com", "analytics", "tracker",
  "pixel", "beacon", "adservice", "ads.", "ad.",
];

function isTrackingDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
}

/**
 * Build a proxy URL: /api/proxy-html/https://example.com/path
 * This handles ALL resource types (HTML, CSS, JS, images, fonts)
 */
function toProxyUrl(originalUrl: string, baseUrl: string): string {
  let resolved: string;
  try {
    resolved = new URL(originalUrl, baseUrl).href;
  } catch {
    return originalUrl;
  }
  return `/api/proxy-html/r?url=${encodeURIComponent(resolved)}`;
}

/**
 * Rewrite all URLs in HTML attributes to go through our proxy
 */
function rewriteHtmlUrls(html: string, pageUrl: string): string {
  // Rewrite <a href="...">
  html = html.replace(
    /<a\b([^>]*?)\s+href\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, href: string) => {
      const trimmed = href.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("javascript:") ||
          trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") ||
          trimmed.startsWith("data:")) {
        return `<a${attrs} href=${quote}${href}${quote}`;
      }
      return `<a${attrs} href=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite <img src="..."> and <img data-src="...">
  html = html.replace(
    /<img\b([^>]*?)\s+(src|data-src)\s*=\s*(["'])([^"']*?)\3/gi,
    (_match, attrs: string, attr: string, quote: string, val: string) => {
      const trimmed = val.trim();
      if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
        return `<img${attrs} ${attr}=${quote}${val}${quote}`;
      }
      return `<img${attrs} ${attr}=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite <link href="..."> (CSS, icons)
  html = html.replace(
    /<link\b([^>]*?)\s+href\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, href: string) => {
      const trimmed = href.trim();
      if (!trimmed) return `<link${attrs} href=${quote}${href}${quote}`;
      return `<link${attrs} href=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite <script src="...">
  html = html.replace(
    /<script\b([^>]*?)\s+src\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, src: string) => {
      const trimmed = src.trim();
      if (!trimmed || isTrackingDomain(trimmed)) return ""; // Remove tracking scripts
      return `<script${attrs} src=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite <source src="..."> (video/audio)
  html = html.replace(
    /<source\b([^>]*?)\s+src\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, src: string) => {
      const trimmed = src.trim();
      if (!trimmed) return `<source${attrs} src=${quote}${src}${quote}`;
      return `<source${attrs} src=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite <iframe src="...">
  html = html.replace(
    /<iframe\b([^>]*?)\s+src\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, src: string) => {
      const trimmed = src.trim();
      if (!trimmed) return `<iframe${attrs} src=${quote}${src}${quote}`;
      return `<iframe${attrs} src=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite <form action="...">
  html = html.replace(
    /<form\b([^>]*?)\s+action\s*=\s*(["'])([^"']*?)\2/gi,
    (_match, attrs: string, quote: string, action: string) => {
      const trimmed = action.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("javascript:")) {
        return `<form${attrs} action=${quote}${action}${quote}`;
      }
      return `<form${attrs} action=${quote}${toProxyUrl(trimmed, pageUrl)}${quote}`;
    }
  );

  // Rewrite srcset
  html = html.replace(
    /srcset\s*=\s*(["'])([^"']*?)\1/gi,
    (_match, quote: string, srcset: string) => {
      const rewritten = srcset.split(",").map(part => {
        const [url, ...rest] = part.trim().split(/\s+/);
        if (!url || url.startsWith("data:")) return part.trim();
        return `${toProxyUrl(url, pageUrl)} ${rest.join(" ")}`;
      }).join(", ");
      return `srcset=${quote}${rewritten}${quote}`;
    }
  );

  return html;
}

/**
 * Remove tracking/ads scripts, keep functional scripts
 */
function removeTrackingScripts(html: string): { html: string; bytesStripped: number } {
  const originalLen = Buffer.byteLength(html, "utf8");
  let out = html;

  // Remove tracking script blocks
  out = out.replace(
    /<script\b[^>]*(?:google-analytics|googletagmanager|facebook|doubleclick|adsense|adsbygoogle|pagead|quantserve|scorecardresearch|hotjar|clarity\.ms|mixpanel|segment|amplitude|pinimg|connect\.facebook|analytics|tracker|beacon)[^>]*>[\s\S]*?<\/script>/gi,
    ""
  );

  // Remove tracking pixels (1x1 images from trackers)
  out = out.replace(
    /<img\b[^>]*\b(?:height\s*=\s*["']?1["']?|width\s*=\s*["']?1["']?)[^>]*(?:google|facebook|doubleclick|pixel|beacon|tracker)[^>]*>/gi,
    ""
  );

  // Remove inline tracking event handlers
  out = out.replace(
    /\s(onload|onerror|onbeforeunload)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  // Remove noscript
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Strip javascript: URIs
  out = out.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, "");

  // Remove <meta http-equiv="refresh"> redirects to external
  out = out.replace(
    /<meta\b[^>]*http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^"']*url\s*=\s*(?!\/api\/)[^"']*["'][^>]*>/gi,
    ""
  );

  const newLen = Buffer.byteLength(out, "utf8");
  return { html: out, bytesStripped: Math.max(0, originalLen - newLen) };
}

/**
 * Inject a <base> tag and a navigation interceptor script
 */
function injectProxyScripts(html: string, originalUrl: string): string {
  // Inject <base> tag
  let out = html.replace(
    /(<head\b[^>]*>)/i,
    `$1<base href="${originalUrl}">`
  );

  // Inject navigation interceptor script
  const interceptor = `<script>
(function(){
  // Intercept link clicks to route through proxy
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    // Already a proxy URL
    if(href.startsWith('/api/proxy-html')) return;
    e.preventDefault();
    // Resolve relative URLs
    var resolved = href;
    try { resolved = new URL(href, window.location.href).href; } catch(ex) { resolved = href; }
    // Navigate the parent iframe
    if(window.parent !== window) {
      window.parent.postMessage({ type: 'shabah-navigate', url: resolved }, '*');
    }
  });

  // Post title to parent
  if(window.parent !== window && document.title) {
    window.parent.postMessage({ type: 'shabah-title', title: document.title }, '*');
  }
  var observer = new MutationObserver(function(){
    if(document.title) window.parent.postMessage({ type: 'shabah-title', title: document.title }, '*');
  });
  observer.observe(document.querySelector('title') || document.documentElement, { childList: true, characterData: true, subtree: true });
})();
</script>`;

  // Inject after <head>
  out = out.replace(
    /(<head\b[^>]*>[^]*?)(?=<\/head>)/i,
    `$1${interceptor}`
  );

  // If no </head> found, inject at start
  if (!out.includes(interceptor)) {
    out = out.replace(/(<head\b[^>]*>)/i, `$1${interceptor}`);
  }

  return out;
}

/** Error page */
function errorPage(message: string, status: number, originalUrl?: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>خطأ ${status} — شبح</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Alexandria, Tajawal, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0a0a0a; color: #e5e5e5; direction: rtl; }
    .box { text-align: center; padding: 2rem; max-width: 28rem; }
    .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #ef4444; }
    p { color: #a3a3a3; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem; }
    .url { font-size: 0.75rem; color: #525252; direction: ltr; word-break: break-all; margin-bottom: 1.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08); color: #e5e5e5; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 0.875rem; font-family: inherit; text-decoration: none; transition: background 0.2s; }
    .btn:hover { background: rgba(255,255,255,0.15); }
    .btn-primary { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }
    .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">👻</div>
    <h1>خطأ ${status}</h1>
    <p>${message}</p>
    ${originalUrl ? `<div class="url">${originalUrl}</div>` : ''}
    <div class="actions">
      ${originalUrl ? `<a class="btn" href="/api/proxy-html?url=${encodeURIComponent(originalUrl)}" target="_self">إعادة المحاولة</a>` : ''}
      <button class="btn btn-primary" onclick="window.parent.postMessage({type:'shabah-go-back'},'*')">العودة للنتائج</button>
    </div>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/** Security headers for proxied content */
const PROXY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

/** Handle CORS preflight */
function handleCors(req: NextRequest): NextResponse | null {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: PROXY_HEADERS });
  }
  return null;
}

/** Fetch and proxy a resource (HTML, CSS, JS, image, font, etc.) */
async function proxyResource(url: string): Promise<NextResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        DNT: "1",
        "Sec-GPC": "1",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        ...PROXY_HEADERS,
      },
    });
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Main HTML proxy handler
 */
export async function GET(req: NextRequest) {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const sp = req.nextUrl.searchParams;
  const rawUrl = sp.get("url")?.trim();

  if (!rawUrl) {
    return errorPage('المعلمة "url" مطلوبة.', 400);
  }
  if (!/^https?:\/\//i.test(rawUrl)) {
    return errorPage("يجب أن يبدأ الرابط بـ http:// أو https://.", 400);
  }

  // Check cache
  const cacheKey = `html:${rawUrl}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    metrics.recordProxy(true, cached.bytesStripped);
    return new NextResponse(cached.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Cache": "HIT",
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
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        DNT: "1",
        "Sec-GPC": "1",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404) return errorPage("الصفحة غير موجودة (404).", 404, rawUrl);
      if (res.status === 403) return errorPage("الموقع يمنع الوصول. جرّب الذهاب مباشرة.", 403, rawUrl);
      if (res.status >= 500) return errorPage(`خطأ من الخادم البعيد (${res.status}).`, 502, rawUrl);
      return errorPage(`فشل جلب الصفحة (HTTP ${res.status}).`, 502, rawUrl);
    }

    const contentType = res.headers.get("content-type") || "";
    let rawHtml = await res.text();

    // Not HTML? Proxy as-is
    if (
      !contentType.includes("text/html") &&
      !rawHtml.trim().startsWith("<!") &&
      !rawHtml.trim().toLowerCase().startsWith("<html")
    ) {
      return new NextResponse(rawHtml, {
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
          ...PROXY_HEADERS,
        },
      });
    }

    // 1. Remove tracking scripts (keep functional scripts)
    const { html: cleaned, bytesStripped } = removeTrackingScripts(rawHtml);

    // 2. Inject <base> and navigation interceptor
    const withBase = injectProxyScripts(cleaned, rawUrl);

    // 3. Rewrite all URLs to go through proxy
    const withRewrites = rewriteHtmlUrls(withBase, rawUrl);

    // Cache
    cache.set(cacheKey, { at: Date.now(), html: withRewrites, bytesStripped });
    metrics.recordProxy(false, bytesStripped);

    return new NextResponse(withRewrites, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Cache": "MISS",
        ...PROXY_HEADERS,
      },
    });
  } catch (e: any) {
    console.error("[/api/proxy-html] error:", e);
    const msg = (e?.message || "fetch failed").toLowerCase();
    if (msg.includes("abort") || msg.includes("timeout") || msg.includes("timed out"))
      return errorPage("انتهت مهلة الاتصال بالموقع.", 504, rawUrl);
    return errorPage("حدث خطأ أثناء جلب الصفحة.", 502, rawUrl);
  }
}

/**
 * Resource proxy handler: /api/proxy-html/r?url=...
 * Proxies CSS, JS, images, fonts — any resource type
 */
export async function R(req: NextRequest) {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const sp = req.nextUrl.searchParams;
  const rawUrl = sp.get("url")?.trim();

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Block tracking resources entirely
  if (isTrackingDomain(rawUrl)) {
    return new NextResponse("", { status: 204 });
  }

  const result = await proxyResource(rawUrl);
  if (!result) {
    return new NextResponse("Resource not found", { status: 502 });
  }
  return result;
}
