import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shabah/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
