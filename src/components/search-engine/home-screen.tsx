"use client";

import { SearchBar } from "./search-bar";
import { usePrivacyStore } from "@/store/privacy-store";
import { useSearchStore } from "@/store/search-store";
import { useTranslation } from "@/hooks/use-translation";

const QUICK_LINKS = [
  { name: "ويكيبيديا", nameEn: "Wikipedia", url: "https://ar.wikipedia.org", letter: "W", color: "bg-slate-700" },
  { name: "يوتيوب", nameEn: "YouTube", url: "https://www.youtube.com", letter: "Y", color: "bg-red-600" },
  { name: "GitHub", nameEn: "GitHub", url: "https://github.com", letter: "G", color: "bg-zinc-700" },
  { name: "Archive", nameEn: "Archive", url: "https://archive.org", letter: "A", color: "bg-teal-700" },
];

export function HomeScreen() {
  const { connected, relays, initialized } = usePrivacyStore();
  const startProxy = useSearchStore((s) => s.startProxy);
  const { t, lang } = useTranslation();

  const exitRelay = relays.length >= 3 ? relays[2] : null;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
      {/* Logo */}
      <div className="w-16 h-16 mb-4">
        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
          <circle cx="40" cy="40" r="36" className="fill-primary/15" />
          <circle cx="40" cy="40" r="36" className="stroke-primary/30" strokeWidth="1.5" fill="none" />
          {/* Ghost body */}
          <path d="M28 48c0-12 5-20 12-20s12 8 12 20v8l-5-4-4 4-4-4-5 4v-8z" className="fill-primary" opacity="0.9" />
          {/* Eyes */}
          <circle cx="36" cy="42" r="2.5" className="fill-background" />
          <circle cx="44" cy="42" r="2.5" className="fill-background" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
        <span className="text-primary">ش</span>بح
      </h1>
      <p className="text-[11px] text-muted-foreground font-mono tracking-widest mb-6 dir-ltr">
        SHABAH
      </p>

      {/* Connection status - tiny pill */}
      {initialized && (
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2.5 py-0.5 mb-6 text-[10px] text-muted-foreground">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 pulse-ring" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
          </span>
          {t("home.connected")}
          {exitRelay && (
            <span className="text-muted-foreground/60">· {exitRelay.country}</span>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="w-full max-w-lg mb-8">
        <SearchBar variant="hero" autoFocus />
      </div>

      {/* Quick links - 4 icons */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
        {QUICK_LINKS.map((site) => (
          <button
            key={site.url}
            onClick={() => startProxy(site.url)}
            className="flex flex-col items-center gap-1.5 group"
            title={lang === 'ar' ? site.name : site.nameEn}
          >
            <div
              className={`w-11 h-11 rounded-xl ${site.color} flex items-center justify-center text-white text-base font-bold shadow-sm group-hover:scale-105 transition-transform`}
            >
              {site.letter}
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[56px]">
              {lang === 'ar' ? site.name : site.nameEn}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
