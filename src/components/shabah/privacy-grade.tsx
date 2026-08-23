"use client";

import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Compute a privacy grade A–F from HTTPS + host heuristics.
export function privacyGrade(url: string): { grade: string; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 100;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      score -= 30;
      reasons.push("غير مشفّر (HTTP)");
    } else {
      reasons.push("مشfriction HTTPS");
    }
    const host = u.hostname;
    // Known tracker-heavy domains get a penalty
    const TRACKERS = ["facebook", "google", "doubleclick", "googletagmanager", "analytics", "tiktok", "adsense"];
    if (TRACKERS.some((t) => host.includes(t))) {
      score -= 25;
      reasons.push("نطاق معروف بالتتبّع");
    }
    // Very short-lived domains (suspect)
    if (host.length < 8 || /\d{4,}/.test(host)) {
      score -= 10;
      reasons.push("نطاق مشبوه");
    }
  } catch {
    score -= 40;
    reasons.push("عنوان غير صالح");
  }
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  return { grade, score, reasons };
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 border-green-400/40 bg-green-400/5",
  B: "text-cyan-400 border-cyan-400/40 bg-cyan-400/5",
  C: "text-amber-400 border-amber-400/40 bg-amber-400/5",
  D: "text-orange-400 border-orange-400/40 bg-orange-400/5",
  F: "text-red-400 border-red-400/40 bg-red-400/5",
};

export function PrivacyGrade({ url }: { url: string }) {
  const { grade, reasons } = privacyGrade(url);
  const Icon = grade === "A" || grade === "B" ? ShieldCheck : grade === "F" ? ShieldAlert : Shield;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${GRADE_COLORS[grade]}`}
            aria-label={`تقييم الخصوصية: ${grade}`}
          >
            <Icon className="w-3 h-3" />
            {grade}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          <div className="font-semibold mb-1">تقييم الخصوصية: {grade}</div>
          <ul className="space-y-0.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-muted-foreground">• {r}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
