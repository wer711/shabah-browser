import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = new Map<string, { at: number; reply: string; sources: Array<{ title: string; url: string }> }>();
const CACHE_TTL = 1000 * 60 * 5;

// Graceful degradation
let zaiAvailable = true;
let zaiInstance: any = null;

async function getZai() {
  if (!zaiAvailable) return null;
  try {
    if (!zaiInstance) {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      zaiInstance = await ZAI.create();
    }
    return zaiInstance;
  } catch {
    zaiAvailable = false;
    return null;
  }
}

function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicNumeral(n: number): string {
  return n.toString().split("").map((d) => ARABIC_DIGITS[Number(d)]).join("");
}

function buildSystemPrompt(query: string, results: any[]): string {
  const lines = results.slice(0, 5).map((r, i) => {
    const num = toArabicNumeral(i + 1);
    const snippet = (r.snippet || "").replace(/\s+/g, " ").trim().slice(0, 400);
    const name = (r.name || r.host_name || r.url).replace(/\s+/g, " ").trim();
    return `[${num}] ${name} — ${snippet} (${r.host_name || ""})`;
  }).join("\n");

  return [
    "أنت «موجز شبح AI» — مساعد بحث عربي يلخّص نتائج البحث بإيجاز ودقّة.",
    "المهمة: اكتب إجابة مختصرة (٢-٣ جمل، بحدّ أقصى ٨٠ كلمة) تلخّص أهم ما في نتائج البحث.",
    "القواعد:",
    "- اكتب بالعربية. استشهد بالمصادر بـ [١] [٢] …",
    "- لا تختلق معلومات غير موجودة.",
    `سؤال: «${query}»`,
    "نتائج:",
    lines,
  ].join("\n");
}

function extractCitations(reply: string): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  const re = /\[([0-9\u0660-\u0669]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reply)) !== null) {
    let n = 0, ok = true;
    for (const ch of m[1]) {
      const wi = ARABIC_DIGITS.indexOf(ch);
      if (wi >= 0) n = n * 10 + wi;
      else if (ch >= "0" && ch <= "9") n = n * 10 + (ch.charCodeAt(0) - 48);
      else { ok = false; break; }
    }
    if (ok && n >= 1 && !seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: { query?: string; results?: any[] };
  try { body = (await req.json()) as any; } catch {
    return NextResponse.json({ error: "صيغة JSON غير صالحة" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  const results = Array.isArray(body.results) ? body.results.slice(0, 5) : [];

  if (!query || results.length < 1) {
    return NextResponse.json({ error: "query و results مطلوبان" }, { status: 400 });
  }

  const zai = await getZai();
  if (!zai) {
    return NextResponse.json({
      degraded: true,
      reply: "🔒 الملخّص الذكي متوفر فقط في بيئة التطوير المحلية.",
      sources: [],
    });
  }

  const cacheKey = hashKey(`${query}|${results.map((r) => r.url).join("|")}`);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({ cached: true, reply: cached.reply, sources: cached.sources });
  }

  try {
    const system = buildSystemPrompt(query, results);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 60_000)
    );

    const completion = (await Promise.race([
      zai.chat.completions.create({ messages: [{ role: "system", content: system }, { role: "user", content: query }], temperature: 0.4 }),
      timeout,
    ])) as any;

    const reply: string = completion?.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) return NextResponse.json({ error: "لم يصل ردّ." }, { status: 502 });

    const citedIdxs = extractCitations(reply);
    const sources: Array<{ title: string; url: string }> = [];
    for (const idx of citedIdxs) {
      const item = results[idx - 1];
      if (item?.url) sources.push({ title: item.name || item.host_name || item.url, url: item.url });
    }

    cache.set(cacheKey, { at: Date.now(), reply, sources });
    return NextResponse.json({ cached: false, reply, sources });
  } catch (e: any) {
    return NextResponse.json({ error: "تعذّر توليد الملخّص." }, { status: 502 });
  }
}
