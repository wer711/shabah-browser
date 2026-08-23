"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="w-full">
      <div className={`relative group ${focused ? "scale-[1.01]" : ""} transition-transform`}>
        <div className={`absolute -inset-[1.5px] rounded-2xl opacity-0 transition-opacity duration-300 ${focused ? "opacity-100" : ""} animated-border blur-[1px]`} aria-hidden />
        <div className={`relative flex items-center gap-2 rounded-2xl bg-card/80 backdrop-blur border ${focused ? "border-primary/50" : "border-border"} ${isHero ? "p-2 pl-3" : "p-1.5 pl-2.5"}`}>
          <div className={`flex items-center justify-center rounded-full bg-primary/15 text-primary shrink-0 ${isHero ? "w-10 h-10" : "w-8 h-8"}`}>
            <ShieldCheck className={isHero ? "w-5 h-5" : "w-4 h-4"} />
          </div>
          <Input
            ref={inputRef} type="text" inputMode="search"
            value={local} onChange={(e) => setLocal(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={connected ? t("search.placeholder") : t("search.placeholderOffline")}
            className={`flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 text-foreground placeholder:text-muted-foreground ${isHero ? "h-12 text-lg" : "h-9 text-base"}`}
            aria-label={t("search.label")}
          />
          {local && (
            <Button size="icon" variant="ghost" type="button"
              onClick={() => { setLocal(""); setQuery(""); inputRef.current?.focus(); }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t("search.clear")}>
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button type="button" onClick={() => submit()}
            className={`shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 ${isHero ? "h-12 px-6 text-base" : "h-9 px-4"}`}>
            <Search className="w-4 h-4 ml-1.5" />
            {t("search.button")}
          </Button>
        </div>
      </div>
    </div>
  );
}
