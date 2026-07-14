"use client";

import Link from "next/link";
import { Instagram, Facebook, Youtube, MessageCircle, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { VisitorCounter } from "@/components/home/VisitorCounter";

// Kulübün gerçek sosyal medya adresleri — admin panelinden (İletişim Bilgileri)
// override edilmezse bu varsayılan gerçek linkler kullanılır.
const DEFAULT_WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029Vb8QGA1LdQeVZBIM2x3Z";
const DEFAULT_INSTAGRAM = "https://www.instagram.com/tunaspor.1954.esk?igsh=MWNidmJiNjA4MTZyZA==";

interface ContactInfo {
  whatsapp_channel_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
}

export function Footer({ contactInfo }: { contactInfo?: ContactInfo }) {
  const { t } = useI18n();

  const whatsappChannel = contactInfo?.whatsapp_channel_url || DEFAULT_WHATSAPP_CHANNEL;
  const instagram = contactInfo?.instagram_url || DEFAULT_INSTAGRAM;
  const facebook = contactInfo?.facebook_url;
  const youtube = contactInfo?.youtube_url;

  return (
    <footer className="relative z-20 border-t border-white/10 mt-24 bg-tuna-charcoal">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl text-tuna-yellow mb-2">TUNASPOR 1954</h3>
          <p className="text-sm text-tuna-mist">{t("footer_tagline")}</p>
        </div>
        <div>
          <h4 className="eyebrow mb-3">{t("footer_club_heading")}</h4>
          <ul className="space-y-2 text-sm text-tuna-mist">
            <li><Link href="/kulubumuz" className="hover:text-white">{t("nav_about")}</Link></li>
            <li><Link href="/takimlar" className="hover:text-white">{t("nav_teams")}</Link></li>
            <li><Link href="/akademi" className="hover:text-white">{t("nav_academy")}</Link></li>
            <li>
              <Link href="/#konumlarimiz" className="hover:text-white inline-flex items-center gap-1">
                <MapPin size={13} /> Konumlarımız
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-3">{t("footer_content_heading")}</h4>
          <ul className="space-y-2 text-sm text-tuna-mist">
            <li><Link href="/haberler" className="hover:text-white">{t("nav_news")}</Link></li>
            <li><Link href="/galeri" className="hover:text-white">{t("nav_gallery")}</Link></li>
            <li><Link href="/sponsorlar" className="hover:text-white">{t("nav_sponsors")}</Link></li>
            <li><Link href="/lig-durumu" className="hover:text-white">{t("nav_standings")}</Link></li>
            <li><Link href="/takvim" className="hover:text-white">{t("nav_calendar")}</Link></li>
            <li><Link href="/destekci-duvari" className="hover:text-white">Destekçi Duvarı</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-3">{t("footer_follow_heading")}</h4>
          <div className="flex gap-4 text-tuna-mist">
            <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="hover:text-tuna-gold transition-colors cursor-pointer" size={20} />
            </a>
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="hover:text-tuna-gold transition-colors cursor-pointer" size={20} />
              </a>
            )}
            {youtube && (
              <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="hover:text-tuna-gold transition-colors cursor-pointer" size={20} />
              </a>
            )}
            <a href={whatsappChannel} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Kanalı">
              <MessageCircle className="hover:text-tuna-gold transition-colors cursor-pointer" size={20} />
            </a>
          </div>
          <a
            href={whatsappChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs border border-tuna-gold/30 text-tuna-gold rounded-full px-3 py-1.5 hover:bg-tuna-gold/10 hover:border-tuna-gold transition-colors"
          >
            <MessageCircle size={13} /> {t("footer_whatsapp_cta")}
          </a>
        </div>
      </div>
      <div className="flex justify-center pb-4">
        <VisitorCounter />
      </div>
      <div className="text-center text-xs text-tuna-mist/60 pb-6">
        © {new Date().getFullYear()} Tunaspor 1954. {t("footer_rights")}
      </div>
    </footer>
  );
}
