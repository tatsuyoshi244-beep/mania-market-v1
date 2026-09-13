import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ManiaGuideWidget } from "@/components/mania-guide/mania-guide-widget";
import { SiteHeader } from "@/components/site-header";
import { AcquisitionTracker } from "@/components/acquisition-tracker";
import { Suspense } from "react";
import "./globals.css";

export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Mania Market — マニア専門店の発見プラットフォーム",
  description: "ヴィンテージ、Webサービス、AIツールまで。マニアのための専門ショップと商品を発見"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} bg-paper font-sans text-ink antialiased dark:bg-ink dark:text-paper`}>
        <SiteHeader />
        <Suspense fallback={null}><AcquisitionTracker /></Suspense>
        <main>{children}</main>
        <ManiaGuideWidget />
      </body>
    </html>
  );
}
