"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ShieldCheck } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useTranslation } from "@/hooks/use-translation";

interface SearchBarProps {
  variant?: "hero" | "compact";
  autoFocus?: boolean;
}

export function SearchBar({ variant = "hero", autoFocus = false }: SearchBarProps) {
  const { query, setQuery, setView, setResults, setError, setSummary } = useSearchStore();
  const connected = usePrivacyStore((s) => s.connected);
  const [local, setLocal] = useState(query);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => { setLocal(query); }, [query]);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  const submit = (q?: string) => {
    const value = (q ?? local).trim();
    if (!value) return;
    setQuery(value);
    setResults([]);
    setError(null);
    setSummary(null);
    setView("results");
    window.dispatchEvent(new CustomEvent("onionsearch:submit", { detail: value }));
  };

  const onKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); };
  const isHero = variant === "hero";

  const containerClass = [
    "relative flex items-center gap-1.5 sm:gap-2 rounded-2xl backdrop-blur-xl border transition-colors duration-300 w-full min-w-0",
    isHero ? "bg-card/60 border-border/80 p-1 sm:p-1.5 sm:pl-2" : "bg-card/80 border-border p-1 pl-1.5",
    focused ? "border-primary/40 shadow-lg shadow-primary/5" : "hover:border-border",
  ].join(" ");

  const iconClass = [
    "flex items-center justify-center rounded-xl shrink-0 transition-all duration-300",
    isHero ? "w-9 h-9 sm:w-11 sm:h-11" : "w-7 h-7 sm:w-8 sm:h-8",
    focused
      ? "bg-primary/20 text-primary"
      : "bg-primary/10 text-primary/70 group-hover:bg-primary/15 group-hover:text-primary",
  ].join(" ");

  const btnClass = [
    "shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-xl text-primary-foreground font-medium transition-all duration-300",
    isHero ? "h-10 px-3 sm:h-11 sm:px-5 text-xs sm:text-sm" : "h-7 px-2.5 sm:h-8 sm:px-3.5 text-[11px] sm:text-xs",
    focused
      ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/25"
      : "bg-primary/80 hover:bg-primary",
  ].join(" ");

  const inputClass = [
    "flex-1 min-w-0 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-foreground truncate",
    isHero ? "h-10 sm:h-12 px-1.5 sm:px-2 text-sm sm:text-base sm:text-lg" : "h-7 sm:h-9 px-1 sm:px-1.5 text-xs sm:text-sm",
  ].join(" ");

  const clearClass = [
    "shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors",
    isHero ? "w-8 h-8 sm:w-9 sm:h-9" : "w-6 h-6 sm:w-7 sm:h-7",
  ].join(" ");

  return (
    <div className="w-full min-w-0">
      <div className={"relative group transition-all duration-300 " + (focused ? (isHero ? "scale-[1.02]" : "scale-[1.01]") : "")}>
        {/* Animated glow ring */}
        <div
          className={"absolute -inset-[2px] rounded-2xl transition-opacity duration-500 " + (focused ? "opacity-100" : "opacity-0")}
          style={focused ? {
            backgroundImage: "linear-gradient(135deg, var(--primary) 0%, oklch(0.55 0.2 250) 50%, var(--primary) 100%)",
            backgroundSize: "200% 200%",
            animation: "border-flow 3s ease infinite",
          } : undefined}
          aria-hidden
        />

        {/* Glass container */}
        <div className={containerClass}>
          {/* Shield icon */}
          <div className={iconClass}>
            <ShieldCheck className={["transition-transform duration-300", isHero ? "w-4 h-4 sm:w-5 sm:h-5" : "w-3.5 h-3.5 sm:w-4 sm:h-4", focused ? "scale-110" : ""].join(" ")} />
          </div>

          {/* Input */}
          <input
            ref={inputRef} type="text" inputMode="search"
            value={local} onChange={(e) => setLocal(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={connected ? t("search.placeholder") : t("search.placeholderOffline")}
            className={inputClass}
            aria-label={t("search.label")}
          />

          {/* Clear button */}
          {local && (
            <button
              type="button"
              onClick={() => { setLocal(""); setQuery(""); inputRef.current?.focus(); }}
              className={clearClass}
              aria-label={t("search.clear")}
            >
              <X className={isHero ? "w-4 h-4 sm:w-4.5 sm:h-4.5" : "w-3 h-3 sm:w-3.5 sm:h-3.5"} />
            </button>
          )}

          {/* Submit button */}
          <button type="button" onClick={() => submit()} className={btnClass}>
            <Search className={isHero ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-3 h-3 sm:w-3.5 sm:h-3.5"} />
            <span className="hidden sm:inline">{t("search.button")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
