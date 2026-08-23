import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory cache ONLY — never persisted. Keyed by a stable hash of the
// query + the first result URL (so identical queries with different
// result sets get fresh summaries).
const cache = new Map<string, { at: number; reply: string; sources: Array<{ title: string; url: string }> }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 min

interface SummaryResult {
  name: string;
  snippet: string;
  url: string;
  host_name: string;
}

// Cheap non-crypto hash (djb2). Cache keys are not security-sensitive.
function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicNumeral(n: number): string {
  return n
    .toString()
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)])
    .join("");
}

function buildSystemPrompt(query: string, results: SummaryResult[]): string {
  const lines = results
    .slice(0, 5)
    .map((r, i) => {
      const num = toArabicNumeral(i + 1);
      const snippet = (r.snippet || "").replace(/\s+/g, " ").trim().slice(0, 400);
      const name = (r.name || r.host_name || r.url).replace(/\s+/g, " ").trim();
      return `[${num}] ${name} — ${snippet} (${r.host_name || ""})`;
    })
    .join("\n");

  return [
    "أنت «موجز شبح AI» — مساعد بحث عربي يلخّص نتائج البحث بإيجاز ودقّة.",
    "المهمة: اكتب إجابة مختصرة (٢-٣ جمل، بحدّ أقصى ٨٠ كلمة) تلخّص أهم ما في نتائج البحث التالية المتعلقة بسؤال المستخدم.",
    "القواعد الصارمة:",
    "- اكتب بالعربية الفصحى المبسّطة. لا تخلط بالإنجليزية إلا لأسماء علمية لا تُترجم.",
    "- استشهد بالمصادر داخل النص بصيغة [١] [٢] [٣] … حيث الرقم يطابق ترتيب النتيجة في القائمة (تبدأ من ١).",
    "- لا تستشهد برقم غير موجود في القائمة (القائمة تحتوي على ٥ نتائج كحدّ أقصى).",
    "- لا تكتب عناوين URL داخل النص — الاكتفاء بالأرقام [١] [٢] …",
    "- لا تكشف أي معلومة عن المستخدم أو جلسته أو عنوان IP — أنت تركّب نصًا فقط من النتائج.",
    "- لا تختلق معلومات غير موجودة في النتائج. إذا كانت النتائج غير كافية للإجابة، قل ذلك بصدق واقترح صياغة أفضل للبحث.",
    "- لا تُهِمِل السؤال: أجب مباشرة عمّا يطرحه المستخدم.",
    "",
    `سؤال المستخدم: «${query}»`,
    "",
    "نتائج البحث (أفضل ٥):",
    lines,
  ].join("\n");
}

// Parse [١] [٢] [3] style citation tokens from the reply and return
// the unique 1-based indices in order of first appearance.
function extractCitations(reply: string): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  const re = /\[([0-9\u0660-\u0669]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reply)) !== null) {
    let n = 0;
    let ok = true;
    for (const ch of m[1]) {
      const wi = ARABIC_DIGITS.indexOf(ch);
      if (wi >= 0) {
        n = n * 10 + wi;
      } else if (ch >= "0" && ch <= "9") {
        n = n * 10 + (ch.charCodeAt(0) - 48);
      } else {
        ok = false;
        break;
      }
    }
    if (ok && n >= 1 && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function safeError(message: string) {
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function POST(req: NextRequest) {
  let body: { query?: string; results?: SummaryResult[] };
  try {
    body = (await req.json()) as { query?: string; results?: SummaryResult[] };
  } catch {
    return NextResponse.json({ error: "صيغة JSON غير صالحة" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  const results = Array.isArray(body.results) ? body.results.slice(0, 5) : [];

  if (!query) {
    return NextResponse.json({ error: "query مطلوب" }, { status: 400 });
  }
  if (results.length < 1) {
    return NextResponse.json({ error: "results مطلوب" }, { status: 400 });
  }

  const cacheKey = hashKey(`${query}|${results.map((r) => r.url).join("|")}`);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({
      cached: true,
      reply: cached.reply,
      sources: cached.sources,
    });
  }

  try {
    const zai = await getZai();
    const system = buildSystemPrompt(query, results);

    // Race against a 60s timeout — the synthesizer must stay snappy.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 60_000)
    );

    const completion = (await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: query },
        ],
        temperature: 0.4,
        // Disable any tool/function calling — we want plain text synthesis.
      }),
      timeout,
    ])) as { choices?: Array<{ message?: { content?: string } }> };

    const reply: string = completion?.choices?.[0]?.message?.content?.trim() || "";

    if (!reply) {
      return safeError("لم يصل ردّ من المساعد. حاول مجددًا.");
    }

    // Build cited sources list from the reply's [n] markers, mapped to
    // the corresponding result item (1-based).
    const citedIdxs = extractCitations(reply);
    const sources: Array<{ title: string; url: string }> = [];
    for (const idx of citedIdxs) {
      const item = results[idx - 1];
      if (item && item.url) {
        sources.push({ title: item.name || item.host_name || item.url, url: item.url });
      }
    }

    cache.set(cacheKey, { at: Date.now(), reply, sources });

    return NextResponse.json({
      cached: false,
      reply,
      sources,
    });
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError" || err?.message === "timeout") {
      return safeError("انتهت مهلة توليد الملخّص. حاول مرة أخرى.");
    }
    console.error("[/api/ai/summarize] error:", err?.message || e);
    return safeError("تعذّر توليد الملخّص الآن. جرّب لاحقًا.");
  }
}
