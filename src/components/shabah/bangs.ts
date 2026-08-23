// !Bangs system (DuckDuckGo-style shortcuts)
// User types !bang <query> → redirect to target site via proxy

export interface Bang {
  bang: string; // e.g. "!ويكي"
  label: string;
  url: string; // template: replace {q} with encoded query
  proxied: boolean; // open via our anonymous proxy?
  icon?: string; // emoji or short text
}

export const BANGS: Bang[] = [
  { bang: "!ويكي", label: "ويكيبيديا", url: "https://ar.wikipedia.org/wiki/{q}", proxied: true, icon: "📚" },
  { bang: "!ويكي-ان", label: "Wikipedia EN", url: "https://en.wikipedia.org/wiki/{q}", proxied: true, icon: "📖" },
  { bang: "!يوتيوب", label: "YouTube", url: "https://www.youtube.com/results?search_query={q}", proxied: true, icon: "▶️" },
  { bang: "!خبر", label: "أخبار", url: "https://news.google.com/search?q={q}", proxied: true, icon: "📰" },
  { bang: "!github", label: "GitHub", url: "https://github.com/search?q={q}", proxied: true, icon: "💻" },
  { bang: "!stack", label: "Stack Overflow", url: "https://stackoverflow.com/search?q={q}", proxied: true, icon: "❓" },
  { bang: "!reddit", label: "Reddit", url: "https://www.reddit.com/search/?q={q}", proxied: true, icon: "👽" },
  { bang: "!hackernews", label: "Hacker News", url: "https://hn.algolia.com/?q={q}", proxied: true, icon: "🟧" },
  { bang: "!arxiv", label: "arXiv", url: "https://arxiv.org/abs/{q}", proxied: true, icon: "📄" },
  { bang: "!wikipedia", label: "Wikipedia", url: "https://en.wikipedia.org/wiki/{q}", proxied: true, icon: "📖" },
  { bang: "!mdn", label: "MDN", url: "https://developer.mozilla.org/ar/search?q={q}", proxied: true, icon: "🌐" },
  { bang: "!archive", label: "Archive.org", url: "https://web.archive.org/web/*/{q}", proxied: true, icon: "🏛️" },
  { bang: "!ph", label: "Product Hunt", url: "https://www.producthunt.com/search?q={q}", proxied: true, icon: "🦔" },
  { bang: "!maps", label: "خرائط", url: "https://www.openstreetmap.org/search?query={q}", proxied: true, icon: "🗺️" },
  { bang: "!ar", label: "بحث عربي", url: "https://www.google.com/search?hl=ar&q={q}", proxied: true, icon: "🔍" },
];

export function matchBang(input: string): { bang: Bang; query: string } | null {
  const trimmed = input.trim();
  const m = trimmed.match(/^(![^\s]+)\s+(.+)$/);
  if (!m) return null;
  const bangToken = m[1].toLowerCase();
  const query = m[2].trim();
  const found = BANGS.find((b) => b.bang.toLowerCase() === bangToken);
  if (!found) return null;
  return { bang: found, query };
}

export function bangUrl(bang: Bang, query: string): string {
  return bang.url.replace("{q}", encodeURIComponent(query));
}
