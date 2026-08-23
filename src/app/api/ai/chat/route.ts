import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// No persistence of any kind — no cache, no log of user messages.
// The chat endpoint is stateless by design.

interface HistoryTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

function safeError(message: string) {
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function POST(req: NextRequest) {
  let body: {
    message?: string;
    history?: HistoryTurn[];
    contextUrl?: string;
  };
  try {
    body = (await req.json()) as {
      message?: string;
      history?: HistoryTurn[];
      contextUrl?: string;
    };
  } catch {
    return NextResponse.json({ error: "صيغة JSON غير صالحة" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const contextUrl = (body.contextUrl || "").trim();

  // Build the system prompt. Per spec: if contextUrl is present, instruct
  // the model that the user is browsing a specific page.
  let systemPrompt: string;
  if (contextUrl) {
    // Defensive: only pass the URL string, never any session metadata.
    systemPrompt = `أنت مساعد شبح AI. المستخدم يتصفّح صفحة بعنوان ${contextUrl}. ساعده على فهمها أو لخّصها.`;
  } else {
    systemPrompt =
      "أنت مساعد شبح AI — مساعد بحث مجهّل. لا تكشف أي معلومات شخصية. أجب بالعربية بإيجاز.";
  }

  // Compose the messages array. The store sends `history` INCLUDING the
  // just-added user message (last item). We deduplicate: if the last
  // history item is the same content as `message`, we don't append again.
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const t of history) {
    if (t && t.role && typeof t.content === "string" && t.content.trim()) {
      messages.push({ role: t.role, content: t.content });
    }
  }

  // Fallback: if history was empty, use the explicit message field.
  if (messages.length === 1 && message) {
    messages.push({ role: "user", content: message });
  }

  if (messages.length < 2) {
    return NextResponse.json({ error: "message مطلوب" }, { status: 400 });
  }

  try {
    const zai = await getZai();

    // Race against a 5-minute timeout per spec.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5 * 60 * 1000)
    );

    const completion = (await Promise.race([
      zai.chat.completions.create({
        messages,
        temperature: 0.6,
      }),
      timeout,
    ])) as { choices?: Array<{ message?: { content?: string } }> };

    const reply: string = completion?.choices?.[0]?.message?.content?.trim() || "";

    if (!reply) {
      return safeError("لم يصل ردّ من المساعد.");
    }

    return NextResponse.json({
      reply,
      sources: [],
    });
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError" || err?.message === "timeout") {
      return safeError("انتهت مهلة المساعد. حاول مرة أخرى.");
    }
    // Intentionally do NOT log user message contents anywhere.
    console.error("[/api/ai/chat] error (no message content logged):", err?.message || "unknown");
    return safeError("تعذّر الحصول على ردّ الآن. جرّب لاحقًا.");
  }
}
