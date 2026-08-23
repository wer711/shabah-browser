export type Lang = "ar" | "en";

const ar: Record<string, string> = {
  // Sidebar nav
  "nav.home": "الرئيسية",
  "nav.results": "النتائج",
  "nav.settings": "الإعدادات",
  "nav.admin": "لوحة التحكم",
  "nav.ai": "شبح AI",
  "nav.new": "جديد",
  "nav.newIdentity": "هوية جديدة",
  "nav.recentSearches": "آخر البحوث",
  "nav.clear": "مسح",
  "nav.clearHistoryTitle": "مسح السجل المحلي",
  "nav.homeTitle": "الصفحة الرئيسية",
  "nav.collapseSidebar": "طيّ الشريط",
  "nav.expandSidebar": "توسيع الشريط",

  // Mobile bottom bar
  "mobile.search": "بحث",
  "mobile.settings": "إعدادات",
  "mobile.admin": "تحكم",

  // Sidebar footer
  "footer.firewallActive": "الجدار الناري نشط",
  "footer.firewallDisabled": "الجدار معطّل",
  "footer.firewallTitle": "جدار شبح الناري نشط — {count} محاولة اعتراض",
  "footer.firewallDisabledTitle": "الجدار الناري معطّل",

  // Site footer
  "site.networkActive": "الشبكة المجهّلة نشطة",
  "site.disconnected": "غير متصل",
  "site.firewallActive": "الجدار الناري نشط",
  "site.firewallDisabled": "معطّل",
  "site.zeroLogs": "صفر سجلّات",
  "site.homePage": "الصفحة الرئيسية",

  // Search bar
  "search.placeholder": "ابحث بأمان — عنوانك مخفي عبر 3 عُقد...",
  "search.placeholderOffline": "اكتب استعلام البحث...",
  "search.clear": "مسح",
  "search.button": "بحث",
  "search.label": "حقل البحث المجهّل",
  "search.recentTitle": "آخر عمليات البحث (محلي فقط — لا يتم تسجيلها)",

  // Results view
  "results.routing": "جارٍ التوجيه عبر العُقد...",
  "results.aboutCount": "حوالي {count} نتيجة لـ «{query}»",
  "results.tabWeb": "ويب",
  "results.tabNews": "أخبار",
  "results.tabImages": "صور",
  "results.noResults": "لا توجد نتائج مطابقة. جرّب كلمات مفتاحية أخرى.",
  "results.infoTitle": "معلومة",
  "results.infoText": "اضغط «تصفّح مجهّل» لفتح أي نتيجة عبر البروكسي. اضغط «لخّص بـ AI» لطلب موجز من شبح AI. لن يرى الموقع عنوانك — فقط عنوان عقدة الخروج.",

  // Result card
  "result.anonBrowse": "تصفّح مجهّل",
  "result.summarize": "لخّص بـ AI",
  "result.direct": "مباشر",
  "result.ipHidden": "IP مخفي",
  "result.anonTitle": "فتح الموقع عبر التصفح المجهّل",
  "result.summarizeTitle": "اطلب من شبح AI تلخيص هذه الصفحة",

  // Privacy panel
  "privacy.notConnected": "غير متصل بالشبكة المجهّلة",
  "privacy.notConnectedDesc": "اتصالك مكشوف الآن. فعّل الـ VPN/Proxy لمواصلة البحث بأمان.",
  "privacy.connected": "متصّل بشبكة شبح",
  "privacy.rotate": "دورة",
  "privacy.identity": "هوية",
  "privacy.you": "أنت",
  "privacy.destination": "الوجهة",
  "privacy.anonSearches": "بحث مجهّل",
  "privacy.proxiedPages": "صفحة proxied",
  "privacy.trackersBlocked": "تتبّع محظور",
  "privacy.interceptAttempts": "محاولة اعتراض",

  // Session ID
  "session.copied": "تم نسخ مُعرّف الجلسة",
  "session.title": "مُعرّف الجلسة",
  "session.copy": "نسخ",
  "session.newIdentityTitle": "هوية جديدة — يبدّل الجلسة + الدائرة + يمسح العدّادات",
  "session.autoRotate": "يتبدّل تلقائيًا كل 24 ساعة. لا يربط بهويتك الحقيقية — مجرد مُعرّف مؤقت.",
  "session.compactTitle": "مُعرّف جلسة مجهّل (يتبدّل كل 24 ساعة)",

  // Proxy view
  "proxy.backToResults": "عودة للنتائج",
  "proxy.fakeIp": "عنوان وهمي:",
  "proxy.rotate": "دورة",
  "proxy.direct": "مباشر",
  "proxy.directTitle": "فتح مباشر (يكشف عنوانك)",
  "proxy.rotateTitle": "تبديل عقدة الخروج",
  "proxy.privacyBanner": "تصفّح مجهّل مفعّل.",
  "proxy.privacyDesc": "هذا المحتوى جُلب عبر خادمنا ثم عبر عقدة خروج — الموقع المستهدف لا يرى عنوانك الحقيقي. السكريبتات والتتبّعات مُزالة تلقائيًا.",
  "proxy.fetchFailed": "تعذّر جلب المحتوى",
  "proxy.retry": "إعادة المحاولة",
  "proxy.noContent": "لا يوجد محتوى للعرض.",
  "proxy.routingProgress": "جارٍ توجيه الطلب عبر عقدة الدخول ← العقدة الوسيطة ← عقدة الخروج...",
  "proxy.destination": "الوجهة",

  // Home screen
  "home.connected": "متصّل",
  "home.nodes": "{count} عُقد",
  "home.exit": "خروج",
  "home.shortcuts": "اختصارات:",
  "home.quickLaunch": "إطلاق سريع",
  "home.quickLaunchDesc": "كل موقع يُفتح عبر البروكسي المجهّل",
  "home.openAnon": "فتح {name} بشكل مجهّل",
  "home.aiTitle": "شبح AI",
  "home.aiSubtitle": "مساعدك المجهّل",
  "home.aiDesc": "اسأل أي سؤال — يبحث في الويب ويُجيب بإيجاز مع مصادر موثّقة. لا يُخزّن المحادثة ولا يُستخدم في التدريب.",
  "home.aiChat": "ابدأ المحادثة",
  "home.aiChatContext": "مساعد شبح AI",
  "home.zeroDataTitle": "صفر بيانات",
  "home.zeroDataSubtitle": "التزام الخصوصية",
  "home.zeroDataDesc": "لا نخزّن استعلامات البحث، لا سجلّات IP، لا كوكيز. كل العمليات تُنفّذ من الخادم نيابةً عنك فلا تصل هويتك لأي موقع.",

  // AI Summarizer
  "ai.summaryTitle": "موجز شبح AI",
  "ai.sources": "{count} مصدر",
  "ai.noSummary": "لا يوجد موجز.",
  "ai.closeSummary": "إغلاق الموجز",

  // Settings
  "settings.title": "الإعدادات",
  "settings.subtitle": "خصّص متصفّحك المجهّل — كل التفضيلات محفوظة محليًا فقط",
  "settings.general": "عام",
  "settings.circuit": "الدائرة",
  "settings.security": "الأمان",
  "settings.privacy": "الخصوصية",
  "settings.search": "البحث",
  "settings.firewall": "الجدار الناري",
  "settings.about": "حول",
  "settings.protection": "الحماية",
  "settings.more": "المزيد",
  "settings.theme": "السمة",
  "settings.themeDesc": "داكن أو فاتح",
  "settings.dark": "داكن",
  "settings.light": "فاتح",
  "settings.language": "اللغة",
  "settings.languageDesc": "لغة الواجهة",
  "settings.resultsPerPage": "عدد النتائج لكل صفحة",
  "settings.resultsCount": "{count} نتيجة",
  "settings.defaultTab": "التبويب الافتراضي",
  "settings.defaultTabDesc": "أي تبويب يُفتح عند البحث",
  "settings.adminMode": "وضع المدير",
  "settings.adminModeDesc": "إظهار تبويب لوحة التحكم في الشريط الجانبي",
  "settings.languageChanged": "تم تغيير اللغة بنجاح",
  "settings.web": "ويب",
  "settings.news": "أخبار",
  "settings.images": "صور",

  // Firewall settings
  "firewall.todayAttempts": "محاولات اعتراض اليوم",

  // About
  "about.title": "حول شبح",
  "about.description": "متصفّح بحث مجهّل يدمج بين بساطة Tor ومميزات Opera. توجيه متعدد العناوين (3 عُقد)، جدار ناري نشط، AI مدمج، صفر بيانات محفوظة.",
  "about.encryption": "التشفير",
  "about.backup": "+ AES-256-GCM احتياطي",
  "about.privacyCommitment": "التزام الخصوصية:",
  "about.privacyText": "لا نخزّن أي بيانات. لا سجلّات IP، لا استعلامات بحث، لا كوكيز. كل عمليات البحث تُنفّذ من الخادم نيابةً عنك، والذاكرة تُمحى عند الإغلاق.",
  "about.reset": "إعادة ضبط كل الإعدادات",
};

const en: Record<string, string> = {
  // Sidebar nav
  "nav.home": "Home",
  "nav.results": "Results",
  "nav.settings": "Settings",
  "nav.admin": "Dashboard",
  "nav.ai": "Shabah AI",
  "nav.new": "New",
  "nav.newIdentity": "New Identity",
  "nav.recentSearches": "Recent Searches",
  "nav.clear": "Clear",
  "nav.clearHistoryTitle": "Clear local history",
  "nav.homeTitle": "Home Page",
  "nav.collapseSidebar": "Collapse sidebar",
  "nav.expandSidebar": "Expand sidebar",

  // Mobile bottom bar
  "mobile.search": "Search",
  "mobile.settings": "Settings",
  "mobile.admin": "Admin",

  // Sidebar footer
  "footer.firewallActive": "Firewall Active",
  "footer.firewallDisabled": "Firewall Off",
  "footer.firewallTitle": "Shabah Firewall active — {count} interception attempts",
  "footer.firewallDisabledTitle": "Firewall disabled",

  // Site footer
  "site.networkActive": "Anonymous Network Active",
  "site.disconnected": "Disconnected",
  "site.firewallActive": "Firewall Active",
  "site.firewallDisabled": "Off",
  "site.zeroLogs": "Zero Logs",
  "site.homePage": "Home",

  // Search bar
  "search.placeholder": "Search safely — your address is hidden via 3 nodes...",
  "search.placeholderOffline": "Enter your search query...",
  "search.clear": "Clear",
  "search.button": "Search",
  "search.label": "Anonymous search field",
  "search.recentTitle": "Recent searches (local only — not logged)",

  // Results view
  "results.routing": "Routing through nodes...",
  "results.aboutCount": "About {count} results for «{query}»",
  "results.tabWeb": "Web",
  "results.tabNews": "News",
  "results.tabImages": "Images",
  "results.noResults": "No matching results. Try different keywords.",
  "results.infoTitle": "Info",
  "results.infoText": "Click «Browse Anonymously» to open any result via proxy. Click «Summarize with AI» to request a summary from Shabah AI. The site won't see your address — only the exit node's address.",

  // Result card
  "result.anonBrowse": "Browse Anonymously",
  "result.summarize": "Summarize with AI",
  "result.direct": "Direct",
  "result.ipHidden": "IP Hidden",
  "result.anonTitle": "Open site via anonymous browsing",
  "result.summarizeTitle": "Ask Shabah AI to summarize this page",

  // Privacy panel
  "privacy.notConnected": "Not connected to anonymous network",
  "privacy.notConnectedDesc": "Your connection is exposed. Enable VPN/Proxy to continue searching safely.",
  "privacy.connected": "Connected to Shabah Network",
  "privacy.rotate": "Rotate",
  "privacy.identity": "Identity",
  "privacy.you": "You",
  "privacy.destination": "Destination",
  "privacy.anonSearches": "Anonymous searches",
  "privacy.proxiedPages": "Proxied pages",
  "privacy.trackersBlocked": "Trackers blocked",
  "privacy.interceptAttempts": "interception attempts",

  // Session ID
  "session.copied": "Session ID copied",
  "session.title": "Session ID",
  "session.copy": "Copy",
  "session.newIdentityTitle": "New identity — changes session + circuit + resets counters",
  "session.autoRotate": "Auto-rotates every 24 hours. Not linked to your real identity — just a temporary ID.",
  "session.compactTitle": "Anonymous session ID (rotates every 24h)",

  // Proxy view
  "proxy.backToResults": "Back to Results",
  "proxy.fakeIp": "Fake IP:",
  "proxy.rotate": "Rotate",
  "proxy.direct": "Direct",
  "proxy.directTitle": "Open direct (reveals your address)",
  "proxy.rotateTitle": "Switch exit node",
  "proxy.privacyBanner": "Anonymous browsing active.",
  "proxy.privacyDesc": "This content was fetched through our server then through an exit node — the target site cannot see your real address. Scripts and trackers are removed automatically.",
  "proxy.fetchFailed": "Failed to fetch content",
  "proxy.retry": "Retry",
  "proxy.noContent": "No content to display.",
  "proxy.routingProgress": "Routing request through Entry node ← Middle node ← Exit node...",
  "proxy.destination": "Destination",

  // Home screen
  "home.connected": "Connected",
  "home.nodes": "{count} nodes",
  "home.exit": "Exit",
  "home.shortcuts": "Shortcuts:",
  "home.quickLaunch": "Quick Launch",
  "home.quickLaunchDesc": "Every site opens via anonymous proxy",
  "home.openAnon": "Open {name} anonymously",
  "home.aiTitle": "Shabah AI",
  "home.aiSubtitle": "Your anonymous assistant",
  "home.aiDesc": "Ask anything — searches the web and answers concisely with trusted sources. Doesn't store conversations or use them for training.",
  "home.aiChat": "Start Chat",
  "home.aiChatContext": "Shabah AI Assistant",
  "home.zeroDataTitle": "Zero Data",
  "home.zeroDataSubtitle": "Privacy Commitment",
  "home.zeroDataDesc": "We don't store search queries, no IP logs, no cookies. All operations are executed on our server on your behalf, so your identity never reaches any site.",

  // AI Summarizer
  "ai.summaryTitle": "Shabah AI Summary",
  "ai.sources": "{count} sources",
  "ai.noSummary": "No summary available.",
  "ai.closeSummary": "Close summary",

  // Settings
  "settings.title": "Settings",
  "settings.subtitle": "Customize your anonymous browser — all preferences are saved locally only",
  "settings.general": "General",
  "settings.circuit": "Circuit",
  "settings.security": "Security",
  "settings.privacy": "Privacy",
  "settings.search": "Search",
  "settings.firewall": "Firewall",
  "settings.about": "About",
  "settings.protection": "Protection",
  "settings.more": "More",
  "settings.theme": "Theme",
  "settings.themeDesc": "Dark or Light",
  "settings.dark": "Dark",
  "settings.light": "Light",
  "settings.language": "Language",
  "settings.languageDesc": "Interface language",
  "settings.resultsPerPage": "Results per page",
  "settings.resultsCount": "{count} results",
  "settings.defaultTab": "Default Tab",
  "settings.defaultTabDesc": "Which tab opens when searching",
  "settings.adminMode": "Admin Mode",
  "settings.adminModeDesc": "Show dashboard tab in sidebar",
  "settings.languageChanged": "Language changed successfully",
  "settings.web": "Web",
  "settings.news": "News",
  "settings.images": "Images",

  // Firewall settings
  "firewall.todayAttempts": "Interception attempts today",

  // About
  "about.title": "About Shabah",
  "about.description": "Anonymous search browser combining Tor's simplicity with Opera's features. Multi-hop routing (3 nodes), active firewall, built-in AI, zero data stored.",
  "about.encryption": "Encryption",
  "about.backup": "+ AES-256-GCM backup",
  "about.privacyCommitment": "Privacy Commitment:",
  "about.privacyText": "We don't store any data. No IP logs, no search queries, no cookies. All search operations are executed by the server on your behalf, and memory is wiped on close.",
  "about.reset": "Reset All Settings",
};

const translations: Record<Lang, Record<string, string>> = { ar, en };

export function t(key: string, lang: Lang, params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] ?? translations.ar[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
