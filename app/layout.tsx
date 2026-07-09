import type { Metadata } from "next";
import { Bebas_Neue, Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { AtmosphereProvider } from "@/components/layout/AtmosphereProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { DeferredEffects } from "@/components/layout/DeferredEffects";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementTicker } from "@/components/layout/AnnouncementTicker";
import { PageViewTracker } from "@/components/layout/PageViewTracker";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";
import { PushSubscriber } from "@/components/layout/PushSubscriber";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PageTransitionProvider } from "@/components/layout/PageTransitionProvider";
import { createClient } from "@/lib/supabase/server";
import IntroVideo from "@/components/IntroVideo";
import { CustomCursor } from "@/components/layout/CustomCursor";

// Next.js build sırasında bu fontları Google Fonts'tan otomatik indirip
// kendi statik dosyalarına gömer — lisans dosyası elle eklemeye gerek yok,
// harici runtime isteği de olmaz (self-hosted + gizlilik dostu).
const displayFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const subtitleFont = Montserrat({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-subtitle",
  display: "swap",
});
const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tunaspor1954.org"),
  title: {
    default: "Tunaspor 1954 | Resmi Web Sitesi",
    template: "%s | Tunaspor 1954",
  },
  description:
    "Tunaspor 1954 resmi dijital platformu — takımlar, akademi, haberler, fikstür ve daha fazlası.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Tunaspor 1954",
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: contactInfo } = await supabase
    .from("contact_info")
    .select("whatsapp_channel_url, instagram_url, facebook_url, youtube_url")
    .eq("id", 1)
    .single();

  return (
    <html lang="tr" className={`${displayFont.variable} ${subtitleFont.variable} ${bodyFont.variable}`}>
      <body>
        <IntroVideo />
        <CustomCursor />
        <I18nProvider>
        <AtmosphereProvider>
          <DeferredEffects />
          <AnnouncementTicker />
          <Navbar />
          <main className="relative z-20">
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </main>
          <Footer contactInfo={contactInfo ?? undefined} />
          <PageViewTracker />
          <ServiceWorkerRegistrar />
          <PushSubscriber />
          <ScrollToTop />
        </AtmosphereProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
