"use client";

import {
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
  const incrementPages = usePrivacyStore((s) => s.incrementPages);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setView = useSearchStore((s) => s.setView);
  const setResults = useSearchStore((s) => s.setResults);
  const setError = useSearchStore((s) => s.setError);
  const setSummary = useSearchStore((s) => s.setSummary);
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

  return (
    <main className="flex-1 w-full pb-8">
      {/* HERO — Clean, Google-like */}
      <section className="relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 pt-16 sm:pt-24 pb-6 text-center">
          {/* Logo + Title */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20">
              <ShabahLogo size={80} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            <span className="glow-text text-primary font-medium">ش</span>بح
          </h1>
          <p className="text-sm text-muted-foreground/70 mt-1">{t("home.tagline")}</p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative overflow-hidden">
            <SearchBar variant="hero" autoFocus />
          </div>
        </div>
      </section>

      {/* Speed-dial grid */}
      <section className="max-w-2xl mx-auto px-4 pt-6 pb-6">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {SPEED_DIAL.map((site, i) => (
            <button
              key={site.url}
              onClick={() => { incrementPages(); window.open(site.url, '_blank', 'noopener,noreferrer'); }}
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

      {/* Features — subtle, below the fold */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="rounded-2xl border border-border/60 bg-card/30 p-4 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold mb-1">{t(`home.feature_${f.key}_title`)}</h3>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                  {t(`home.feature_${f.key}_desc`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* AI CTA */}
        <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold">{t("home.aiTitle")}</p>
              <p className="text-[10px] text-muted-foreground">{t("home.aiSubtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => { openAIContext("", t("home.aiChatContext")); toggleAI(true); }}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5 transition-colors"
          >
            {t("home.aiChat")}
          </button>
        </div>
      </section>
    </main>
  );
}
