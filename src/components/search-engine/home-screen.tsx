"use client";

import Image from "next/image";
import {
  ShieldCheck,
  EyeOff,
  Lock,
  Globe2,
  Zap,
  Bot,
  Flame,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { SearchBar } from "./search-bar";
import { usePrivacyStore } from "@/store/privacy-store";
import { useSearchStore } from "@/store/search-store";
import { useAIStore } from "@/store/ai-store";
import { ShabahLogo } from "@/components/shabah/logo";
import { SessionIdBadge } from "@/components/shabah/session-id";
import { BANGS } from "@/components/shabah/bangs";

const FEATURES = [
  {
    icon: EyeOff,
    title: "بدون قيود على المنصات",
    desc: "النتائج لا تُفلتر — كل ما هو موجود على الويب يظهر، بما في ذلك المحجوب.",
  },
  {
    icon: Lock,
    title: "توجيه متعدد العناوين",
    desc: "حارس دخول ← عقدة وسيطة ← عقدة خروج. كل عقدة في دولة مختلفة.",
  },
  {
    icon: Bot,
    title: "AI مدمج",
    desc: "موجز فوري فوق النتائج + مساعد دردشة «شبح AI» يلخّص أي صفحة بضغطة.",
  },
  {
    icon: Flame,
    title: "جدار ناري نشط",
    desc: "حظر XSS، CSRF، فحص المنافذ، تعدين العملات، بصمة الإصبع — تلقائيًا.",
  },
];

const SPEED_DIAL = [
  { name: "ويكيبيديا", url: "https://ar.wikipedia.org", color: "from-slate-600 to-slate-800", letter: "W" },
  { name: "يوتيوب", url: "https://www.youtube.com", color: "from-red-600 to-red-800", letter: "Y" },
  { name: "الجزيرة", url: "https://www.aljazeera.net", color: "from-amber-600 to-amber-800", letter: "ج" },
  { name: "GitHub", url: "https://github.com", color: "from-zinc-700 to-zinc-900", letter: "G" },
  { name: "Reddit", url: "https://www.reddit.com", color: "from-orange-600 to-orange-800", letter: "R" },
  { name: "Archive", url: "https://archive.org", color: "from-teal-700 to-teal-900", letter: "A" },
  { name: "Hacker News", url: "https://news.ycombinator.com", color: "from-orange-500 to-orange-700", letter: "H" },
  { name: "OpenStreetMap", url: "https://www.openstreetmap.org", color: "from-green-700 to-green-900", letter: "M" },
];

export function HomeScreen() {
  const { connected, relays, visibleIp, sessionId, newIdentity, firewallActive, blockedAttempts } =
    usePrivacyStore();
  const setQuery = useSearchStore((s) => s.setQuery);
  const startProxy = useSearchStore((s) => s.startProxy);
  const openAIContext = useAIStore((s) => s.openWithContext);
  const toggleAI = useAIStore((s) => s.togglePanel);

  const submitSuggestion = (text: string) => {
    setQuery(text);
    window.dispatchEvent(
      new CustomEvent("onionsearch:submit", { detail: text })
    );
  };

  const openSite = (url: string, name: string) => {
    startProxy(url, name);
  };

  return (
    <main className="flex-1 w-full scroll-mt-14 sm:scroll-mt-0 pb-16 sm:pb-8">
      {/* HERO */}
      <section className="grid-bg relative overflow-hidden">
        {/* Decorative floating ghosts */}
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
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px]">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 pulse-ring" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-primary font-medium">متصّل</span>
              <span className="text-muted-foreground">
                {relays.length} عُقد · خروج {relays[2]?.country || "—"}
              </span>
              <span className="text-muted-foreground/40">|</span>
              <code className="text-muted-foreground dir-ltr text-[10px]">{visibleIp}</code>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 max-w-2xl mx-auto relative">
            <SearchBar variant="hero" autoFocus />
          </div>
        </div>
      </section>

      {/* Speed-dial grid (Opera-style) */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-10">
        <h2 className="text-xs font-medium text-muted-foreground/70 mb-4">إطلاق سريع</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {SPEED_DIAL.map((site, i) => (
            <button
              key={site.url}
              onClick={() => openSite(site.url, site.name)}
              className={`group flex flex-col items-center gap-1.5 ${i >= 4 ? 'hidden sm:flex' : ''}`}
              title={`فتح ${site.name} بشكل مجهّل`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${site.color} flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform`}
              >
                {site.letter}
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground truncate max-w-[60px]">
                {site.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card/40 backdrop-blur p-5 hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Session + AI CTA + Privacy promise */}
      <section className="max-w-5xl mx-auto px-4 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="hidden lg:block">
          <SessionIdBadge />
        </div>

        {/* AI CTA */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">شبح AI</h3>
              <p className="text-[10px] text-muted-foreground">مساعدك المجهّل</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">
            اسأل أي سؤال — يبحث في الويب ويُجيب بإيجاز مع مصادر موثّقة. لا يُخزّن
            المحادثة ولا يُستخدم في التدريب.
          </p>
          <button
            onClick={() => {
              openAIContext("", "مساعد شبح AI");
              toggleAI(true);
            }}
            className="self-start rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5"
          >
            ابدأ المحادثة
          </button>
        </div>

        {/* Privacy promise */}
        <div className="hidden lg:block rounded-2xl border border-border bg-card/40 p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">صفر بيانات</h3>
              <p className="text-[10px] text-muted-foreground">التزام الخصوصية</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            لا نخزّن استعلامات البحث، لا سجلّات IP، لا كوكيز. كل العمليات تُنفّذ
            من الخادم نيابةً عنك فلا تصل هويتك لأي موقع.
          </p>
        </div>
      </section>
    </main>
  );
}

// Decorative floating ghost SVGs
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
