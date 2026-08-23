import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Alexandria } from "next/font/google";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shabah/theme-provider";

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "شبح — متصفّح البحث المجهّل",
  description:
    "شبح: محرك بحث ومتصفّح خاص بلا قيود، يدمج بساطة Tor ومميزات Opera — AI مدمج، توجيه متعدد العناوين، جدار ناري، صفر بيانات محفوظة.",
  keywords: [
    "شبح",
    "Shabah",
    "Ghost",
    "متصفح مجهّل",
    "محرك بحث",
    "VPN",
    "Tor",
    "خصوصية",
  ],
  authors: [{ name: "Shabah" }],
  icons: {
    icon: "/shabah-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="شبح" />
        <link rel="apple-touch-icon" href="/shabah-logo.png" />
      </head>
      <body
        className={`${alexandria.variable} ${cairo.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
