import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// AI Chat — graceful degradation when z-ai-web-dev-sdk is unavailable
// (e.g., deployed on Vercel without .z-ai-config)

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

interface HistoryTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  let body: { message?: string; history?: HistoryTurn[]; contextUrl?: string };
  try {
    body = (await req.json()) as any;
  } catch {
    return NextResponse.json({ error: "صيغة JSON غير صالحة" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const contextUrl = (body.contextUrl || "").trim();

  const zai = await getZai();
  if (!zai) {
    return NextResponse.json({
      reply: "🔒 المساعد الذكي متوفر فقط في بيئة التطوير المحلية. على الاستضافة العامة، يمكنك استخدام البحث والتصفح المجهّل بشكل كامل.",
      sources: [],
      degraded: true,
    });
  }

  let systemPrompt: string;
  if (contextUrl) {
    systemPrompt = `أنت مساعد شبح AI. المستخدم يتصفّح صفحة بعنوان ${contextUrl}. ساعده على فهمها أو لخّصها.`;
  } else {
    systemPrompt = "أنت مساعد شبح AI — مساعد بحث مجهّل. لا تكشف أي معلومات شخصية. أجب بالعربية بإيجاز.";
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const t of history) {
    if (t?.role && typeof t.content === "string" && t.content.trim()) {
      messages.push({ role: t.role, content: t.content });
    }
  }
  if (messages.length === 1 && message) {
    messages.push({ role: "user", content: message });
  }
  if (messages.length < 2) {
    return NextResponse.json({ error: "message مطلوب" }, { status: 400 });
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5 * 60 * 1000)
    );

    const completion = (await Promise.race([
      zai.chat.completions.create({ messages, temperature: 0.6 }),
      timeout,
    ])) as any;

    const reply: string = completion?.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) return NextResponse.json({ error: "لم يصل ردّ من المساعد." }, { status: 502 });

    return NextResponse.json({ reply, sources: [] });
  } catch (e: any) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError" || err?.message === "timeout") {
      return NextResponse.json({ error: "انتهت مهلة المساعد." }, { status: 502 });
    }
    return NextResponse.json({ error: "تعذّر الحصول على ردّ الآن." }, { status: 502 });
  }
}
