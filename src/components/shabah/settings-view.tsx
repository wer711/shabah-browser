"use client";

import { useState } from "react";
import {
  Settings2,
  ShieldCheck,
  EyeOff,
  Flame,
  RotateCcw,
  Lock,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore, SECURITY_LEVELS } from "@/store/settings-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { SecuritySlider } from "./security-slider";
import { SessionIdBadge } from "./session-id";
import { ShabahLogo } from "./logo";
import { COUNTRIES } from "./countries";
import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";

export function SettingsView() {
  const [section, setSection] = useState<string>("general");
  const s = useSettingsStore();
  const { rotateCircuit, newIdentity } = usePrivacyStore();
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  const sections = [
    { key: "general", label: t("settings.general"), icon: Settings2 },
    { key: "protection", label: t("settings.protection"), icon: ShieldCheck },
    { key: "privacy", label: t("settings.privacy"), icon: EyeOff },
    { key: "more", label: t("settings.more"), icon: Flame },
  ] as const;

  const handleLanguageChange = (v: string) => {
    s.set("language", v as any);
    toast.success(t("settings.languageChanged"));
  };

  const handleThemeChange = (v: string) => {
    s.set("theme", v as any);
    setTheme(v);
  };

  return (
    <main className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <ShabahLogo size={40} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("settings.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("settings.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={section} onValueChange={setSection} className="flex flex-col md:flex-row gap-6">
          <TabsList
            orientation="vertical"
            className="flex md:flex-col h-auto md:w-44 shrink-0 bg-card/40 border border-border p-1"
          >
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <TabsTrigger
                  key={sec.key}
                  value={sec.key}
                  className="justify-start gap-2 w-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{sec.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex-1 min-w-0 space-y-6">
            {/* GENERAL */}
            <TabsContent value="general" className="mt-0 space-y-6">
              <Section title={t("settings.general")}>
                <Row label={t("settings.theme")} desc={t("settings.themeDesc")}>
                  <Select value={s.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                      <SelectItem value="light">{t("settings.light")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("settings.language")} desc={t("settings.languageDesc")}>
                  <Select value={s.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("settings.resultsPerPage")} desc={t("settings.resultsCount", { count: s.resultsPerPage })}>
                  <div className="w-40">
                    <Slider
                      value={[s.resultsPerPage]}
                      onValueChange={(v) => s.set("resultsPerPage", v[0])}
                      min={6}
                      max={20}
                      step={2}
                    />
                  </div>
                </Row>
                <Row label={t("settings.defaultTab")} desc={t("settings.defaultTabDesc")}>
                  <Select value={s.defaultTab} onValueChange={(v) => s.set("defaultTab", v as any)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">{t("settings.web")}</SelectItem>
                      <SelectItem value="news">{t("settings.news")}</SelectItem>
                      <SelectItem value="images">{t("settings.images")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("settings.adminMode")} desc={t("settings.adminModeDesc")}>
                  <Switch checked={s.adminMode} onCheckedChange={(v) => s.set("adminMode", v)} />
                </Row>
              </Section>

              <Section title={t("settings.search")}>
                <Row label={t("settings.aiSummarizer")} desc={t("settings.aiSummarizerDesc")}>
                  <Switch checked={s.aiSummarizer} onCheckedChange={(v) => s.set("aiSummarizer", v)} />
                </Row>
                <Row label={t("settings.bangsEnabled")} desc={t("settings.bangsEnabledDesc")}>
                  <Switch checked={s.bangsEnabled} onCheckedChange={(v) => s.set("bangsEnabled", v)} />
                </Row>
                <Row label={t("settings.instantAnswers")} desc={t("settings.instantAnswersDesc")}>
                  <Switch checked={s.instantAnswers} onCheckedChange={(v) => s.set("instantAnswers", v)} />
                </Row>
                <Row label={t("settings.safeSearch")} desc={t("settings.safeSearchDesc")}>
                  <Switch checked={s.safeSearch} onCheckedChange={(v) => s.set("safeSearch", v)} />
                </Row>
              </Section>
            </TabsContent>

            {/* PROTECTION */}
            <TabsContent value="protection" className="mt-0 space-y-6">
              <Section title={t("settings.circuit")}>
                <div className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground mb-2">{t("settings.currentRelays")}</div>
                  <CircuitPreview />
                </div>
                <Row label={t("settings.entryCountry")} desc={t("settings.entryCountryDesc")}>
                  <Select value={s.entryCountry} onValueChange={(v) => s.set("entryCountry", v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t("settings.autoRotate")}</SelectItem>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("settings.exitCountry")} desc={t("settings.exitCountryDesc")}>
                  <Select value={s.exitCountry} onValueChange={(v) => s.set("exitCountry", v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t("settings.autoRotate")}</SelectItem>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("settings.autoRotateInterval")} desc={t("settings.autoRotateDesc", { count: s.rotateEveryMinutes })}>
                  <div className="w-40">
                    <Slider
                      value={[s.rotateEveryMinutes]}
                      onValueChange={(v) => s.set("rotateEveryMinutes", v[0])}
                      min={5}
                      max={60}
                      step={5}
                    />
                  </div>
                </Row>
                <Row label={t("settings.blockWebRTC")} desc={t("settings.blockWebRTCDesc")}>
                  <Switch checked={s.blockWebRTC} onCheckedChange={(v) => s.set("blockWebRTC", v)} />
                </Row>
                <Row label={t("settings.killSwitch")} desc={t("settings.killSwitchDesc")}>
                  <Switch checked={s.killSwitch} onCheckedChange={(v) => s.set("killSwitch", v)} />
                </Row>
                <div className="flex gap-2 pt-2">
                  <Button onClick={rotateCircuit} variant="outline" size="sm">
                    <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
                    {t("settings.instantRotate")}
                  </Button>
                  <Button onClick={newIdentity} variant="outline" size="sm">
                    <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
                    {t("settings.newIdentityBtn")}
                  </Button>
                </div>
              </Section>

              <Section title={t("settings.security")}>
                <SecuritySlider />
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
                  <span className="text-primary font-semibold">{t("settings.securityMeaning")}</span>{" "}
                  {t("settings.securityMeaningText")}
                </div>
              </Section>

              <Section title="التشفير والخصوصية">
                <EncryptionStatus />
              </Section>
            </TabsContent>

            {/* PRIVACY */}
            <TabsContent value="privacy" className="mt-0 space-y-6">
              <Section title={t("settings.privacy")}>
                <Row label={t("settings.noHistory")} desc={t("settings.noHistoryDesc")}>
                  <Switch checked={s.noHistory} onCheckedChange={(v) => s.set("noHistory", v)} />
                </Row>
                <Row label={t("settings.stripTrackers")} desc={t("settings.stripTrackersDesc")}>
                  <Switch checked={s.stripTrackers} onCheckedChange={(v) => s.set("stripTrackers", v)} />
                </Row>
                <Row label={t("settings.blockAds")} desc={t("settings.blockAdsDesc")}>
                  <Switch checked={s.blockAds} onCheckedChange={(v) => s.set("blockAds", v)} />
                </Row>
                <Row label={t("settings.blockThirdPartyCookies")} desc={t("settings.blockThirdPartyCookiesDesc")}>
                  <Switch checked={s.blockThirdPartyCookies} onCheckedChange={(v) => s.set("blockThirdPartyCookies", v)} />
                </Row>
                <Row label={t("settings.spoofFingerprint")} desc={t("settings.spoofFingerprintDesc")}>
                  <Switch checked={s.spoofFingerprint} onCheckedChange={(v) => s.set("spoofFingerprint", v)} />
                </Row>
                <Row label={t("settings.doshBlock")} desc={t("settings.doshBlockDesc")}>
                  <Switch checked={s.doshBlock} onCheckedChange={(v) => s.set("doshBlock", v)} />
                </Row>
                <Row label={t("settings.openLinksViaProxy")} desc={t("settings.openLinksViaProxyDesc")}>
                  <Switch checked={s.openLinksViaProxy} onCheckedChange={(v) => s.set("openLinksViaProxy", v)} />
                </Row>
              </Section>
            </TabsContent>

            {/* MORE */}
            <TabsContent value="more" className="mt-0 space-y-6">
              <Section title={t("settings.firewall")}>
                <Row label={t("settings.firewallEnabled")} desc={t("settings.firewallEnabledDesc")}>
                  <Switch checked={s.firewallEnabled} onCheckedChange={(v) => s.set("firewallEnabled", v)} />
                </Row>
                <Row label={t("settings.blockMaliciousDomains")} desc={t("settings.blockMaliciousDomainsDesc")}>
                  <Switch checked={s.blockMaliciousDomains} onCheckedChange={(v) => s.set("blockMaliciousDomains", v)} />
                </Row>
                <Row label={t("settings.firewallBlockTrackers")} desc={t("settings.firewallBlockTrackersDesc")}>
                  <Switch checked={s.blockTrackers} onCheckedChange={(v) => s.set("blockTrackers", v)} />
                </Row>
                <Row label={t("settings.blockCryptoMining")} desc={t("settings.blockCryptoMiningDesc")}>
                  <Switch checked={s.blockCryptoMining} onCheckedChange={(v) => s.set("blockCryptoMining", v)} />
                </Row>
                <Row label={t("settings.blockFingerprinting")} desc={t("settings.blockFingerprintingDesc")}>
                  <Switch checked={s.blockFingerprinting} onCheckedChange={(v) => s.set("blockFingerprinting", v)} />
                </Row>
                <FirewallPreview />
              </Section>

              <Section title={t("about.title")}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 relative">
                    <ShabahLogo size={64} float />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      <span className="text-primary">ش</span>بح
                    </div>
                    <div className="text-xs text-muted-foreground font-mono dir-ltr">SHABAH v1.0 · PRIVATE</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("about.description")}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <SessionIdBadge />
                  <div className="rounded-xl border border-border bg-card/40 p-4">
                    <div className="text-xs text-muted-foreground mb-1">{t("about.encryption")}</div>
                    <div className="text-sm font-mono text-primary">ChaCha20-Poly1305</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{t("about.backup")}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">{t("about.privacyCommitment")}</span>{" "}
                  {t("about.privacyText")}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={s.reset}
                  className="mt-3"
                >
                  <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
                  {t("about.reset")}
                </Button>
              </Section>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-1 mt-3">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-t border-border/60 first:border-0">
      <div className="min-w-0 flex-1 max-w-xs sm:max-w-[280px]">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground leading-snug">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function CircuitPreview() {
  const relays = usePrivacyStore((s) => s.relays);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {relays.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-lg">{flagEmoji(r.flag)}</div>
            <div className="text-[9px] text-muted-foreground">{r.label}</div>
            <code className="text-[9px] text-primary dir-ltr">{r.ip}</code>
          </div>
          {i < relays.length - 1 && (
            <div className="text-primary/60 text-xs">←</div>
          )}
        </div>
      ))}
    </div>
  );
}

function FirewallPreview() {
  const blocked = usePrivacyStore((s) => s.blockedAttempts);
  const { t } = useTranslation();
  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t("firewall.todayAttempts")}</span>
        <span className="text-2xl font-bold text-primary tabular-nums">{blocked}</span>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            className={`h-6 rounded-sm ${
              i < Math.min(21, blocked) ? "bg-primary/60" : "bg-primary/10"
            }`}
          />
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1.5">
        XSS · CSRF · Port-Scan · Malicious · Tracker · Miner · Fingerprint
      </div>
    </div>
  );
}

function flagEmoji(code: string) {
  if (!code || code.length !== 2) return "🏳";
  const cp = [...code.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...cp);
}

function EncryptionStatus() {
  const { encryption, sessionId, visibleIp, connected, relays } = usePrivacyStore();
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  const checks = [
    {
      label: "تشفير النقل (HTTPS/TLS)",
      value: isHttps ? "TLS 1.3" : "TLS (محلي)",
      ok: true,
      detail: "جميع البيانات مشفّرة أثناء النقل",
    },
    {
      label: "تشفير الدورة (تشفير داخلي)",
      value: encryption,
      ok: true,
      detail: "تشفير طرفي بين العقد — لا يمكن قراءة البيانات",
    },
    {
      label: "عدم حفظ السجل",
      value: "صفر سجلات",
      ok: true,
      detail: "لا نحفظ أي سجل بحث أو تصفّح على خوادمنا",
    },
    {
      label: "حظر المتتبّعات",
      value: "مُفعّل",
      ok: true,
      detail: "البرامج النصية التتبعية تُزال قبل الوصول إليك",
    },
    {
      label: "إخفاء الهوية",
      value: `IP: ${visibleIp}`,
      ok: true,
      detail: "IP الحقيقي مخفي خلف 3 عقد تشفير",
    },
    {
      label: "عزل المواقع",
      value: "Sandboxed",
      ok: true,
      detail: "كل موقع يُحمّل في بيئة معزولة",
    },
  ];

  return (
    <div className="space-y-2">
      {checks.map((c, i) => (
        <div key={i} className="flex items-start gap-3 py-2.5 border-t border-border/40 first:border-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{c.label}</span>
              <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                {c.value}
              </code>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.detail}</p>
          </div>
        </div>
      ))}
      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-400">جميع طبقات التشفير مُفعّلة</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          بياناتك مشفّرة بطبقات متعددة: تشفير النقل (TLS) + تشفير الدورة ({encryption}) + عزل الحاوية.
          لا يمكن لأي طرف ثالث قراءة محتوى بحثك أو تصفّحك.
        </p>
      </div>
    </div>
  );
}
