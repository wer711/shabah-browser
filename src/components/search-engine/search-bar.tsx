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
    "relative flex items-center gap-2 rounded-2xl backdrop-blur-xl border transition-colors duration-300",
    isHero ? "bg-card/60 border-border/80 p-1.5 pl-2" : "bg-card/80 border-border p-1 pl-2",
    focused ? "border-primary/40 shadow-lg shadow-primary/5" : "hover:border-border",
  ].join(" ");

  const iconClass = [
    "flex items-center justify-center rounded-xl shrink-0 transition-all duration-300",
    isHero ? "w-11 h-11" : "w-8 h-8",
    focused
      ? "bg-primary/20 text-primary"
      : "bg-primary/10 text-primary/70 group-hover:bg-primary/15 group-hover:text-primary",
  ].join(" ");

  const btnClass = [
    "shrink-0 flex items-center gap-1.5 rounded-xl text-primary-foreground font-medium transition-all duration-300",
    isHero ? "h-11 px-5 text-sm" : "h-8 px-3.5 text-xs",
    focused
      ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/25"
      : "bg-primary/80 hover:bg-primary",
  ].join(" ");

  const inputClass = [
    "flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-foreground",
    isHero ? "h-12 px-2 text-base sm:text-lg" : "h-9 px-1.5 text-sm",
  ].join(" ");

  const clearClass = [
    "shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors",
    isHero ? "w-9 h-9" : "w-7 h-7",
  ].join(" ");

  return (
    <div className="w-full">
      <div className={`relative group transition-all duration-300 ${focused ? (isHero ? "scale-[1.02]" : "scale-[1.01]") : ""}`}>
        {/* Animated glow ring */}
        <div
          className={`absolute -inset-[2px] rounded-2xl transition-opacity duration-500 ${focused ? "opacity-100" : "opacity-0"}`}
          style={{
            background: focused
              ? "linear-gradient(135deg, var(--primary) 0%, oklch(0.55 0.2 250) 50%, var(--primary) 100%)"
              : "transparent",
            backgroundSize: "200% 200%",
            animation: focused ? "border-flow 3s ease infinite" : "none",
          }}
          aria-hidden
        />

        {/* Glass container */}
        <div className={containerClass}>
          {/* Shield icon */}
          <div className={iconClass}>
            <ShieldCheck className={`transition-transform duration-300 ${isHero ? "w-5 h-5" : "w-4 h-4"} ${focused ? "scale-110" : ""}`} />
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
              <X className={isHero ? "w-4.5 h-4.5" : "w-3.5 h-3.5"} />
            </button>
          )}

          {/* Submit button */}
          <button type="button" onClick={() => submit()} className={btnClass}>
            <Search className={isHero ? "w-4 h-4" : "w-3.5 h-3.5"} />
            {t("search.button")}
          </button>
        </div>
      </div>
    </div>
  );
}
