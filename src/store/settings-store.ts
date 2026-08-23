import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SecurityLevel = "standard" | "safer" | "safest";
export type Tab = "web" | "news" | "images";
export type HopCountry = "auto" | string;

interface SettingsState {
  // general
  theme: "dark" | "light";
  language: "ar" | "en";
  defaultTab: Tab;
  resultsPerPage: number;
  openLinksViaProxy: boolean; // always-on anonymous view
  safeSearch: boolean;

  // circuit
  securityLevel: SecurityLevel;
  entryCountry: HopCountry;
  exitCountry: HopCountry;
  rotateEveryMinutes: number;
  blockWebRTC: boolean;
  killSwitch: boolean; // always-on, can't be turned off really

  // privacy
  noHistory: boolean;
  stripTrackers: boolean;
  blockAds: boolean;
  blockThirdPartyCookies: boolean;
  spoofFingerprint: boolean;
  doshBlock: boolean; // defense against port scan / waves

  // search
  aiSummarizer: boolean;
  bangsEnabled: boolean;
  instantAnswers: boolean;

  // firewall
  firewallEnabled: boolean;
  blockMaliciousDomains: boolean;
  blockTrackers: boolean;
  blockCryptoMining: boolean;
  blockFingerprinting: boolean;

  // admin
  adminMode: boolean;

  // setters
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  reset: () => void;
}

const DEFAULTS: Omit<SettingsState, "set" | "reset"> = {
  theme: "dark",
  language: "ar",
  defaultTab: "web",
  resultsPerPage: 12,
  openLinksViaProxy: true,
  safeSearch: false,

  securityLevel: "safer",
  entryCountry: "auto",
  exitCountry: "auto",
  rotateEveryMinutes: 10,
  blockWebRTC: true,
  killSwitch: true,

  noHistory: true,
  stripTrackers: true,
  blockAds: true,
  blockThirdPartyCookies: true,
  spoofFingerprint: true,
  doshBlock: true,

  aiSummarizer: true,
  bangsEnabled: true,
  instantAnswers: true,

  firewallEnabled: true,
  blockMaliciousDomains: true,
  blockTrackers: true,
  blockCryptoMining: true,
  blockFingerprinting: true,

  adminMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      reset: () => set(DEFAULTS),
    }),
    {
      name: "shabah-settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, NOT search/ browsing data
      partialize: (state) => {
        const { set: _s, reset: _r, ...rest } = state;
        return rest as SettingsState;
      },
    }
  )
);

// Security level metadata (used by UI labels)
export const SECURITY_LEVELS: Record<
  SecurityLevel,
  { label: string; desc: string; color: string }
> = {
  standard: {
    label: "عادي",
    desc: "كل وظائف الويب مفعّلة. أسرع وضع. مناسب للتصفح اليومي.",
    color: "text-green-400",
  },
  safer: {
    label: "أكثر أمانًا",
    desc: "سكربتات المواقع المعروفة معطّلة، خطوط خارجية ممنوعة. متوازن.",
    color: "text-cyan-400",
  },
  safest: {
    label: "الأقصى",
    desc: "كل السكربتات معطّلة، الصور ممنوعة، بصمة الجهاز مموّهة بالكامل.",
    color: "text-amber-400",
  },
};
