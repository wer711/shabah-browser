"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useTranslation } from "@/hooks/use-translation";

export function ProxyView() {
  const {
    proxyUrl,
    proxyTitle,
    proxyLoading,
    proxyError,
    proxyHtml,
    setProxyLoading,
    setProxyError,
    setProxyContent,
    resetProxy,
  } = useSearchStore();
  const { relays, incrementPages, addBytesSaved, rotateCircuit } =
    usePrivacyStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const fetchProxy = async (url: string) => {
    if (!url) return;
    setProxyLoading(true);
    setProxyError(null);
    try {
      const res = await fetch(
        `/api/proxy?${new URLSearchParams({ url }).toString()}`
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `فشل جلب المحتوى (${res.status})`);
      }
      const data = await res.json();
      setProxyContent(data.html || "", data.title || proxyTitle || url);
      addBytesSaved((data.bytesSaved as number) || 0);
    } catch (e) {
      setProxyError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setProxyLoading(false);
    }
  };

  useEffect(() => {
    if (proxyUrl && !proxyHtml && !proxyError) {
      fetchProxy(proxyUrl);
    }
  }, [proxyUrl]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !proxyHtml) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (/^https?:\/\//i.test(href)) {
        e.preventDefault();
        incrementPages();
        useSearchStore.getState().startProxy(href, a.textContent || href);
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [proxyHtml, incrementPages]);

  let domain = "";
  try {
    if (proxyUrl) domain = new URL(proxyUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = proxyUrl || "";
  }

  return (
    <main className="flex-1 w-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={resetProxy}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            {t("proxy.backToResults")}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground shrink-0">{t("proxy.fakeIp")}</span>
              <code className="text-primary truncate dir-ltr">
                {relays[2]?.ip}
              </code>
              <span className="text-muted-foreground/60 hidden sm:inline">
                ({relays[2]?.country})
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5 dir-ltr">
              {domain}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={rotateCircuit}
            className="text-muted-foreground hover:text-primary"
            title={t("proxy.rotateTitle")}
          >
            <RefreshCw className="w-3.5 h-3.5 ml-1" />
            <span className="hidden sm:inline">{t("proxy.rotate")}</span>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a
              href={proxyUrl || "#"}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-muted-foreground hover:text-foreground"
              title={t("proxy.directTitle")}
            >
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
              <span className="hidden sm:inline">{t("proxy.direct")}</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Privacy banner */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="text-primary font-semibold">{t("proxy.privacyBanner")}</span>{" "}
            {t("proxy.privacyDesc")}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        {proxyLoading ? (
          <ProxySkeleton domain={domain} />
        ) : proxyError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">{t("proxy.fetchFailed")}</p>
            <p className="text-xs text-muted-foreground mb-4">{proxyError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => proxyUrl && fetchProxy(proxyUrl)}
            >
              <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
              {t("proxy.retry")}
            </Button>
          </div>
        ) : proxyHtml ? (
          <article className="rounded-xl border border-border bg-card/40 p-5 sm:p-7">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">
              {proxyTitle}
            </h1>
            <div
              ref={contentRef}
              className="proxy-content text-sm"
              dir="auto"
              dangerouslySetInnerHTML={{ __html: proxyHtml }}
            />
          </article>
        ) : (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            {t("proxy.noContent")}
          </div>
        )}
      </div>
    </main>
  );
}

function ProxySkeleton({ domain }: { domain: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 sm:p-7">
      <div className="flex items-center gap-2 text-xs text-primary mb-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>
          {t("proxy.routingProgress")}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          {t("proxy.destination")}
        </Badge>
        <code className="text-xs text-muted-foreground dir-ltr truncate">
          {domain}
        </code>
      </div>
      <div className="space-y-3 animate-pulse">
        <div className="h-6 w-3/4 bg-muted/60 rounded" />
        <div className="h-3 w-full bg-muted/50 rounded" />
        <div className="h-3 w-5/6 bg-muted/50 rounded" />
        <div className="h-3 w-full bg-muted/50 rounded" />
        <div className="h-3 w-2/3 bg-muted/50 rounded" />
        <div className="h-24 w-full bg-muted/30 rounded mt-4" />
        <div className="h-3 w-full bg-muted/50 rounded" />
        <div className="h-3 w-4/5 bg-muted/50 rounded" />
        <div className="h-3 w-5/6 bg-muted/50 rounded" />
      </div>
    </div>
  );
}
