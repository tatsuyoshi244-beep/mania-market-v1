import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ManiaGuideWidget } from "@/components/mania-guide/mania-guide-widget";
import { SiteHeader } from "@/components/site-header";
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
  title: "好きは、価値になる。｜こだわりの店・商品・サービスを発見",
  description: "好きなことを掘り下げ、知識とこだわりを仕事にした店や作り手を紹介。商品の背景を知り、まだ知らなかった価値に出会える発見サイトです。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} bg-paper font-sans text-ink antialiased dark:bg-ink dark:text-paper`}>
        <SiteHeader />
        <main>{children}</main>
        <ManiaGuideWidget />
      </body>
    </html>
  );
}
