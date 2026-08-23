"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Shield,
  Server,
  Gauge,
  Zap,
  Database,
  Lock,
  TrendingUp,
  Bot,
  Flame,
  Cpu,
  HardDrive,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminStore } from "@/store/admin-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { ShabahLogo } from "./logo";

// Pull aggregate metrics from the server (no per-query data ever exposed)
async function fetchMetrics() {
  try {
    const res = await fetch("/api/admin/metrics", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function AdminDashboard() {
  const admin = useAdminStore();
  const privacy = usePrivacyStore();
  const initialized = usePrivacyStore((s) => s.initialized);
  const [serverMetrics, setServerMetrics] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchMetrics().then(setServerMetrics);
    const t = setInterval(() => {
      fetchMetrics().then(setServerMetrics);
      setNow(new Date());
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Merge client + server metrics
  const merged = {
    totalSearches: (serverMetrics?.totalSearches || 0) + admin.totalSearches,
    totalProxied: (serverMetrics?.totalProxied || 0) + admin.totalProxiedPages,
    cacheHits: (serverMetrics?.cacheHits || 0) + admin.cacheHits,
    cacheMisses: (serverMetrics?.cacheMisses || 0) + admin.cacheMisses,
    aiRequests: (serverMetrics?.aiRequests || 0) + admin.aiRequests,
    firewallBlocks: privacy.blockedAttempts,
    bytesSaved: (serverMetrics?.bytesSaved || 0) + admin.bytesSaved,
    cacheHitRate:
      (serverMetrics?.cacheHits || 0) + admin.cacheHits + admin.cacheMisses + (serverMetrics?.cacheMisses || 0) > 0
        ? Math.round(
            (((serverMetrics?.cacheHits || 0) + admin.cacheHits) /
              ((serverMetrics?.cacheHits || 0) +
                admin.cacheHits +
                admin.cacheMisses +
                (serverMetrics?.cacheMisses || 0))) *
              100
          )
        : 0,
    avgSearchLatency: avg(admin.searchLatencySamples),
    avgProxyLatency: avg(admin.proxyLatencySamples),
  };

  const tldTop = Object.entries(admin.tldBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <main className="flex-1 w-full">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <ShabahLogo size={40} />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                لوحة تحكم شبح
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  سرّي
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                مراقبة فقط — لا تُخزّن استعلامات أو عناوين أو مُعرّفات جلسات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 pulse-ring" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
            </span>
            <span dir="ltr" className="font-mono">{now.toLocaleTimeString("ar-EG")}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                fetchMetrics().then(setServerMetrics);
              }}
              title="تحديث"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Top metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={Search}
            label="إجمالي عمليات البحث"
            value={merged.totalSearches.toLocaleString("ar-EG")}
            color="text-cyan-400"
          />
          <MetricCard
            icon={Shield}
            label="صفحات مُبرمَجة"
            value={merged.totalProxied.toLocaleString("ar-EG")}
            color="text-primary"
          />
          <MetricCard
            icon={Bot}
            label="طلبات AI"
            value={merged.aiRequests.toLocaleString("ar-EG")}
            color="text-purple-400"
          />
          <MetricCard
            icon={Flame}
            label="محاولات اعتراض"
            value={merged.firewallBlocks.toLocaleString("ar-EG")}
            color="text-red-400"
          />
        </div>

        {/* Performance + cache */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-border bg-card/40 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Gauge className="w-4 h-4 text-primary" />
                زمن استجابة البحث
              </CardTitle>
              <CardDescription className="text-xs">متوسط آخر 50 عملية</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-primary tabular-nums">
                {merged.avgSearchLatency.toFixed(0)}<span className="text-sm text-muted-foreground mr-1">ms</span>
              </div>
              <LatencyChart samples={admin.searchLatencySamples} color="var(--chart-1)" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/40 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-primary" />
                معدّل إصابة الكاش
              </CardTitle>
              <CardDescription className="text-xs">كفاءة الكاش في الذاكرة</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-primary tabular-nums">
                {merged.cacheHitRate}<span className="text-sm text-muted-foreground mr-1">%</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>إصابات: {merged.cacheHits}</span>
                <span>أخطاء: {merged.cacheMisses}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${merged.cacheHitRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/40 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                بيانات محفوظة من التتبّع
              </CardTitle>
              <CardDescription className="text-xs">سكربتات/إعلانات ممنوعة</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-primary tabular-nums">
                {formatBytes(merged.bytesSaved)}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
                كل صفحة تُجلب عبر البروكسي نُزيل منها السكربتات والإعلانات — هذه الكمية لا تصل لجهازك أصلًا.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Circuit + system health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-border bg-card/40 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-primary" />
                حالة الدائرة الحالية
              </CardTitle>
              <CardDescription className="text-xs">عُقد التوجيه النشطة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {privacy.relays.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="text-center min-w-[90px] rounded-lg border border-border bg-background/40 p-2">
                      <div className="text-xl">{flagEmoji(r.flag)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{r.label}</div>
                      <code className="text-[9px] text-primary dir-ltr block">{r.ip}</code>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{r.latencyMs}ms · {r.load}%</div>
                    </div>
                    {i < privacy.relays.length - 1 && (
                      <div className="text-primary/60 text-lg">←</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <Lock className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">التشفير:</span>
                <code className="text-primary">{privacy.encryption}</code>
                <span className="text-muted-foreground mr-2">| الجلسة:</span>
                <code className="text-primary dir-ltr">{privacy.sessionId}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/40 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-primary" />
                صحة النظام
              </CardTitle>
              <CardDescription className="text-xs">مراقبة لحظية للموارد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <SystemBar icon={Cpu} label="المعالج" value={serverMetrics?.cpuPercent ?? 18} suffix="%" />
              <SystemBar icon={HardDrive} label="الذاكرة" value={serverMetrics?.memPercent ?? 42} suffix="%" />
              <SystemBar icon={TrendingUp} label="الشبكة" value={serverMetrics?.netPercent ?? 33} suffix="%" />
              <SystemBar icon={Flame} label="الجدار الناري" value={privacy.firewallActive ? 100 : 0} suffix="%" color={privacy.firewallActive ? "var(--primary)" : "var(--destructive)"} />
            </CardContent>
          </Card>
        </div>

        {/* TLD distribution */}
        <Card className="border-border bg-card/40 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-primary" />
              توزيع النطاقات (مجهّل)
            </CardTitle>
            <CardDescription className="text-xs">
              عدّاد مجمّع حسب امتداد النطاق — لا أسماء نطاقات مفصّلة
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {tldTop.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                لا بيانات بعد — ابدأ بالبحث.
              </p>
            ) : (
              <div className="space-y-2">
                {tldTop.map(([tld, count]) => {
                  const max = tldTop[0][1] || 1;
                  return (
                    <div key={tld} className="flex items-center gap-3">
                      <code className="text-xs text-muted-foreground w-16 dir-ltr">.{tld}</code>
                      <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary/60 transition-all flex items-center justify-end px-2"
                          style={{ width: `${(count / max) * 100}%` }}
                        >
                          <span className="text-[9px] text-primary-foreground tabular-nums">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy notice */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-xs text-muted-foreground leading-relaxed">
          <span className="text-primary font-semibold">ملاحظة الخصوصية:</span>{" "}
          كل الأرقام المُعرضة هنا عدّادات مجمّعة في الذاكرة فقط — لا سجلّات IP،
          لا نصوص استعلامات، لا روابط مواقع، لا مُعرّفات جلسات. عند إعادة تشغيل
          الخادم تُمحى كل العدّادات ولا يمكن استرجاعها.
        </div>
      </div>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground truncate">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function SystemBar({ icon: Icon, label, value, suffix, color }: { icon: any; label: string; value: number; suffix: string; color?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="tabular-nums" style={{ color: color || "var(--foreground)" }}>{value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${value}%`, background: color || "var(--primary)" }} />
      </div>
    </div>
  );
}

function LatencyChart({ samples, color }: { samples: number[]; color: string }) {
  if (samples.length === 0) {
    return <div className="text-[10px] text-muted-foreground mt-2">لا عينات بعد</div>;
  }
  const max = Math.max(...samples, 100);
  const w = 240;
  const h = 40;
  const step = w / Math.max(samples.length - 1, 1);
  const points = samples.map((s, i) => `${i * step},${h - (s / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 mt-2" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        fill={color}
        fillOpacity="0.1"
        stroke="none"
        points={`0,${h} ${points} ${w},${h}`}
      />
    </svg>
  );
}

function flagEmoji(code: string) {
  if (!code || code.length !== 2) return "🏳";
  const cp = [...code.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...cp);
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}
