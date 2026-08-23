import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory cache of fetched pages (keyed by URL).
const cache = new Map<string, { at: number; data: any }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 min

// Strip tracking scripts, ads, external resource loaders so the proxied
// page can't leak the user's identity back to the destination or third parties.
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

function safeError(message: string) {
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url")?.trim();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "url must start with http(s)://" },
      { status: 400 }
    );
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    metrics.recordProxy(true, cached.data.bytesSaved || 0);
    return NextResponse.json({
      url,
      cached: true,
      latencyMs: Date.now() - started,
      ...cached.data,
    });
  }

  try {
    const zai = await getZai();
    const result: any = await zai.functions.invoke("page_reader", { url });

    const data = result?.data || result || {};
    const rawHtml: string = data.html || "";
    const title: string = data.title || "";
    const publishedTime: string = data.publishedTime || "";

    const { html: sanitized, bytesStripped } = sanitizeHtml(rawHtml);

    const payload = {
      url,
      title,
      html: sanitized,
      publishedTime,
      bytesSaved: bytesStripped,
      tokensUsed: data.usage?.tokens || 0,
    };

    cache.set(url, { at: Date.now(), data: payload });
    metrics.recordProxy(false, bytesStripped);

    return NextResponse.json({
      url,
      cached: false,
      latencyMs: Date.now() - started,
      ...payload,
    });
  } catch (e: any) {
    console.error("[/api/proxy] error:", e);
    const msg = (e?.message || "fetch failed").toLowerCase();
    if (msg.includes("404")) return safeError("الصفحة غير موجودة (404).");
    if (msg.includes("403") || msg.includes("forbidden"))
      return safeError("الموقع يرفض الوصول (403). جرّب دورة عُقد جديدة.");
    if (msg.includes("timeout") || msg.includes("timed out"))
      return safeError("انتهت مهلة الاتصال بالموقع.");
    return safeError(e?.message || "fetch failed");
  }
}
