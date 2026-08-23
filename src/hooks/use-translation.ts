import { useMemo } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { t, type Lang } from "@/lib/i18n";

export function useTranslation() {
  const lang = useSettingsStore((s) => s.language);

  const translate = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) =>
      t(key, lang as Lang, params);
  }, [lang]);

  return { t: translate, lang: lang as Lang };
}
