import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ManiaGuideWidget } from "@/components/mania-guide/mania-guide-widget";
import { SiteHeader } from "@/components/site-header";
import { AcquisitionTracker } from "@/components/acquisition-tracker";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "マニアマーケット｜専門店・こだわり商品を発見",
    template: "%s｜マニアマーケット"
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    title: "マニアマーケット｜専門店・こだわり商品を発見",
    description: SITE_DESCRIPTION,
    url: "/"
  },
  twitter: {
    card: "summary",
    title: "マニアマーケット｜専門店・こだわり商品を発見",
    description: SITE_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} bg-paper font-sans text-ink antialiased dark:bg-ink dark:text-paper`}>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": absoluteUrl("/#organization"),
                name: SITE_NAME,
                alternateName: ["Mania Market", "マニアマーケット"],
                url: absoluteUrl("/")
              },
              {
                "@type": "WebSite",
                "@id": absoluteUrl("/#website"),
                name: SITE_NAME,
                alternateName: "マニアマーケット",
                url: absoluteUrl("/"),
                inLanguage: "ja-JP",
                publisher: { "@id": absoluteUrl("/#organization") }
              }
            ]
          }}
        />
        <SiteHeader />
        <Suspense fallback={null}><AcquisitionTracker /></Suspense>
        <main>{children}</main>
        <ManiaGuideWidget />
      </body>
    </html>
  );
}
