import { create } from "zustand";

export interface SearchResultItem {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

export type View =
  | "home"
  | "results"
  | "proxy"
  | "settings"
  | "admin";

interface SearchState {
  view: View;
  query: string;
  tab: "web" | "news" | "images";
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
  summary: string | null;
  summarySources: { title: string; url: string }[];
  summaryLoading: boolean;

  proxyUrl: string | null;
  proxyTitle: string | null;
  proxyLoading: boolean;
  proxyError: string | null;
  proxyHtml: string | null;
  proxyPublishedTime: string | null;

  setView: (v: View) => void;
  setQuery: (q: string) => void;
  setTab: (t: "web" | "news" | "images") => void;
  setResults: (r: SearchResultItem[]) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  setSummary: (s: string | null, sources?: { title: string; url: string }[]) => void;
  setSummaryLoading: (b: boolean) => void;

  startProxy: (url: string, title?: string) => void;
  setProxyLoading: (b: boolean) => void;
  setProxyError: (e: string | null) => void;
  setProxyContent: (
    html: string,
    title: string,
    publishedTime?: string
  ) => void;
  resetProxy: () => void;

  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  view: "home",
  query: "",
  tab: "web",
  results: [],
  loading: false,
  error: null,
  summary: null,
  summarySources: [],
  summaryLoading: false,

  proxyUrl: null,
  proxyTitle: null,
  proxyLoading: false,
  proxyError: null,
  proxyHtml: null,
  proxyPublishedTime: null,

  setView: (v) => set({ view: v }),
  setQuery: (q) => set({ query: q }),
  setTab: (t) => set({ tab: t }),
  setResults: (r) => set({ results: r }),
  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e }),
  setSummary: (s, sources = []) =>
    set({ summary: s, summarySources: sources }),
  setSummaryLoading: (b) => set({ summaryLoading: b }),

  startProxy: (url, title) =>
    set({
      view: "proxy",
      proxyUrl: url,
      proxyTitle: title || null,
      proxyLoading: true,
      proxyError: null,
      proxyHtml: null,
      proxyPublishedTime: null,
    }),
  setProxyLoading: (b) => set({ proxyLoading: b }),
  setProxyError: (e) => set({ proxyError: e }),
  setProxyContent: (html, title, publishedTime) =>
    set({
      proxyHtml: html,
      proxyTitle: title,
      proxyLoading: false,
      proxyPublishedTime: publishedTime || null,
    }),
  resetProxy: () =>
    set({
      view: "results",
      proxyUrl: null,
      proxyTitle: null,
      proxyLoading: false,
      proxyError: null,
      proxyHtml: null,
      proxyPublishedTime: null,
    }),

  reset: () =>
    set({
      view: "home",
      query: "",
      results: [],
      loading: false,
      error: null,
      summary: null,
      summarySources: [],
      summaryLoading: false,
      proxyUrl: null,
      proxyTitle: null,
      proxyLoading: false,
      proxyError: null,
      proxyHtml: null,
      proxyPublishedTime: null,
    }),
}));
