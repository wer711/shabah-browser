"use client";

import {
  ShieldCheck,
  EyeOff,
  Lock,
  Bot,
  Flame,
} from "lucide-react";
import { SearchBar } from "./search-bar";
import { usePrivacyStore } from "@/store/privacy-store";
import { useSearchStore } from "@/store/search-store";
import { useAIStore } from "@/store/ai-store";
import { ShabahLogo } from "@/components/shabah/logo";
import { useTranslation } from "@/hooks/use-translation";

const FEATURES = [
  { icon: EyeOff, key: "unrestricted" },
  { icon: Lock, key: "multihop" },
  { icon: Bot, key: "ai" },
  { icon: Flame, key: "firewall" },
];

const SPEED_DIAL = [
  { name: "ويكيبيديا", nameEn: "Wikipedia", url: "https://ar.wikipedia.org", color: "from-slate-600 to-slate-800", letter: "W" },
  { name: "يوتيوب", nameEn: "YouTube", url: "https://www.youtube.com", color: "from-red-600 to-red-800", letter: "Y" },
  { name: "الجزيرة", nameEn: "Al Jazeera", url: "https://www.aljazeera.net", color: "from-amber-600 to-amber-800", letter: "ج" },
  { name: "GitHub", nameEn: "GitHub", url: "https://github.com", color: "from-zinc-700 to-zinc-900", letter: "G" },
  { name: "Reddit", nameEn: "Reddit", url: "https://www.reddit.com", color: "from-orange-600 to-orange-800", letter: "R" },
  { name: "Archive", nameEn: "Archive", url: "https://archive.org", color: "from-teal-700 to-teal-900", letter: "A" },
  { name: "Hacker News", nameEn: "HN", url: "https://news.ycombinator.com", color: "from-orange-500 to-orange-700", letter: "H" },
  { name: "OpenStreetMap", nameEn: "OSM", url: "https://www.openstreetmap.org", color: "from-green-700 to-green-900", letter: "M" },
];

export function HomeScreen() {
  const { connected, relays, visibleIp, firewallActive } = usePrivacyStore();
  const initialized = usePrivacyStore((s) => s.initialized);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setView = useSearchStore((s) => s.setView);
  const setResults = useSearchStore((s) => s.setResults);
  const setError = useSearchStore((s) => s.setError);
  const setSummary = useSearchStore((s) => s.setSummary);
  const startProxy = useSearchStore((s) => s.startProxy);
  const openAIContext = useAIStore((s) => s.openWithContext);
  const toggleAI = useAIStore((s) => s.togglePanel);
  const { t, lang } = useTranslation();

  const submitSuggestion = (text: string) => {
    setQuery(text);
    setResults([]);
    setError(null);
    setSummary(null);
    setView("results");
    window.dispatchEvent(new CustomEvent("onionsearch:submit", { detail: text }));
  };

  const exitRelay = relays.length >= 3 ? relays[2] : null;

  return (
    <main className="flex-1 w-full scroll-mt-12 md:scroll-mt-0 pb-8">
      {/* HERO */}
      <section className="grid-bg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
          <Ghosts />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-12 text-center relative">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20">
              <ShabahLogo size={80} float />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="glow-text text-primary">ش</span>بح
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-mono dir-ltr tracking-widest">
            SHABAH · PRIVATE BROWSER
          </p>

          {/* Status pill */}
          {initialized && (
            <div className="mt-4 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px]">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 pulse-ring" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
                </span>
                <span className="text-primary font-medium">{t("home.connected")}</span>
                <span className="text-muted-foreground">
                  {relays.length} {t("home.nodes", { count: relays.length })} · {t("home.exit")} {exitRelay?.country || "—"}
                </span>
                <span className="text-muted-foreground/40">|</span>
                <code className="text-muted-foreground dir-ltr text-[10px]">{visibleIp}</code>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="mt-6 max-w-2xl mx-auto relative">
            <SearchBar variant="hero" autoFocus />
          </div>
        </div>
      </section>

      {/* Speed-dial grid */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-10">
        <h2 className="text-xs font-medium text-muted-foreground/70 mb-4">{t("home.quickLaunch")}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {SPEED_DIAL.map((site, i) => (
            <button
              key={site.url}
              onClick={() => startProxy(site.url)}
              className={`group flex flex-col items-center gap-1.5 ${i >= 4 ? 'hidden sm:flex' : ''}`}
              title={lang === 'ar' ? `فتح ${site.name} بشكل مجهّل` : `Open ${site.nameEn} anonymously`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${site.color} flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                {site.letter}
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground truncate max-w-[60px]">
                {lang === 'ar' ? site.name : site.nameEn}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="rounded-2xl border border-border bg-card/40 backdrop-blur p-4 sm:p-5 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold mb-1.5">{t(`home.feature_${f.key}_title`)}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  {t(`home.feature_${f.key}_desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI CTA + Privacy promise */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("home.aiTitle")}</h3>
              <p className="text-[10px] text-muted-foreground">{t("home.aiSubtitle")}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">{t("home.aiDesc")}</p>
          <button
            onClick={() => { openAIContext("", t("home.aiChatContext")); toggleAI(true); }}
            className="self-start rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5 transition-colors"
          >
            {t("home.aiChat")}
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("home.zeroDataTitle")}</h3>
              <p className="text-[10px] text-muted-foreground">{t("home.zeroDataSubtitle")}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{t("home.zeroDataDesc")}</p>
        </div>
      </section>
    </main>
  );
}

function Ghosts() {
  return (
    <>
      <div className="absolute top-10 right-10 w-20 h-20 opacity-40 ghost-float">
        <div className="w-full h-full rounded-t-2xl rounded-br-2xl rounded-bl-2xl bg-primary" />
      </div>
      <div className="absolute top-32 left-20 w-12 h-12 opacity-30 ghost-float" style={{ animationDelay: "1s" }}>
        <div className="w-full h-full rounded-t-2xl rounded-br-2xl rounded-bl-2xl bg-primary" />
      </div>
      <div className="absolute bottom-20 right-1/3 w-16 h-16 opacity-25 ghost-float" style={{ animationDelay: "2s" }}>
        <div className="w-full h-full rounded-t-2xl rounded-br-2xl rounded-bl-2xl bg-primary" />
      </div>
    </>
  );
}
