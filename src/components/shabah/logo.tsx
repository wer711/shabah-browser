"use client";

import Image from "next/image";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  float?: boolean;
}

export function ShabahLogo({ size = 96, withWordmark = false, className = "", float = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative ${float ? "ghost-float" : ""}`}
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <Image
          src="/shabah-logo.png"
          alt="شبح"
          fill
          priority
          className="relative object-contain drop-shadow-[0_0_18px_color-mix(in_oklch,_var(--primary)_35%,_transparent)]"
        />
      </div>
      {withWordmark && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold leading-none">
            <span className="glow-text text-primary">ش</span>بح
          </span>
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 dir-ltr">
            SHABAH · PRIVATE
          </span>
        </div>
      )}
    </div>
  );
}
