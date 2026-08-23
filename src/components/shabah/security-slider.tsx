"use client";

import { Shield, ShieldHalf, ShieldOff } from "lucide-react";
import { useSettingsStore, SECURITY_LEVELS, type SecurityLevel } from "@/store/settings-store";

const ORDER: SecurityLevel[] = ["standard", "safer", "safest"];

export function SecuritySlider() {
  const level = useSettingsStore((s) => s.securityLevel);
  const set = useSettingsStore((s) => s.set);
  const meta = SECURITY_LEVELS[level];

  const Icon = level === "standard" ? ShieldOff : level === "safer" ? ShieldHalf : Shield;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className="text-sm font-semibold">مستوى الأمان</span>
        </div>
        <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
      </div>

      {/* The 3-step track */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          {ORDER.map((l, i) => {
            const active = ORDER.indexOf(level) >= i + 1;
            return (
              <button
                key={l}
                onClick={() => set("securityLevel", l)}
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  level === l
                    ? "bg-primary border-primary text-primary-foreground scale-110"
                    : active
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}
                aria-label={SECURITY_LEVELS[l].label}
                title={SECURITY_LEVELS[l].label}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="absolute top-3.5 inset-x-3 h-0.5 bg-border -z-0" />
        <div
          className="absolute top-3.5 right-3 h-0.5 bg-primary -z-0 transition-all"
          style={{
            width: `${(ORDER.indexOf(level) / (ORDER.length - 1)) * 100}%`,
          }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed mt-3">
        {meta.desc}
      </p>
    </div>
  );
}
