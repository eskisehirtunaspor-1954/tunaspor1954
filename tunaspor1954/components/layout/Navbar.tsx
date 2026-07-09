"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Lock, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Mascot } from "./Mascot";
import { HamburgerMenu } from "./HamburgerMenu";
import { SearchOverlay } from "./SearchOverlay";

// Spesifikasyon: sol = logo + yazı + maskot (marka bloğu), orta = tamamen boş,
// sağ = dil seçimi + Yönetici Girişi (üst barda sabit) + hamburger.
// Arama ikonu kullanıcı talebiyle sağ gruba eklendi (haber/oyuncu/takım arama).
//
// GÜNCELLEME: Gerçek glassmorphism — 26px blur (tailwind: backdrop-blur-glass),
// %30-35 opak koyu zemin, ince beyaz cam çerçeve, hafif iç parlama (inset highlight),
// 20px yuvarlatılmış köşeler. Sayfa kaydırıldıkça bar biraz daha opak hale gelir
// (okunabilirlik için), hover'da ince bir altın cam parlaması oluşur.
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-30 px-3 pt-3">
        <header
          className={`mx-auto max-w-7xl rounded-[20px] border border-white/15 backdrop-blur-glass transition-[background-color,box-shadow] duration-300 group/nav ${
            scrolled ? "bg-tuna-black/40 shadow-glass" : "bg-tuna-black/30"
          }`}
          style={{
            boxShadow: scrolled
              ? "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <nav className="flex items-center justify-between px-4 py-3">
            {/* SOL: marka bloğu */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              {!logoError ? (
                <Image
                  src="/images/logo.png"
                  alt="Tunaspor 1954"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain animate-breathe motion-reduce:animate-none group-hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.7)] transition-[filter] duration-300"
                  onError={() => setLogoError(true)}
                  priority
                />
              ) : null}
              <span className="font-display text-xl sm:text-2xl tracking-wide text-white group-hover:text-tuna-gold transition-colors">
                TUNASPOR <span className="text-tuna-gold">1954</span>
              </span>
              <Mascot />
            </Link>

            {/* ORTA: tamamen boş — Hero'nun ön planda olması için */}
            <div className="flex-1" />

            {/* SAĞ: dil + yönetici girişi (sabit) + hamburger */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                aria-label="Sitede ara"
                onClick={() => setSearchOpen(true)}
                className="text-white/80 hover:text-tuna-gold transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <Search size={20} />
              </button>
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <Link
                href="/admin/login"
                aria-label={t("nav_admin")}
                title={t("nav_admin")}
                className="flex items-center gap-2 text-tuna-gold border border-tuna-gold/30 rounded-full px-3.5 py-2 hover:border-tuna-gold hover:shadow-goldGlow hover:bg-tuna-gold/10 transition-all"
              >
                <Lock size={16} />
                <span className="hidden md:inline text-sm">{t("nav_admin")}</span>
              </Link>
              <button
                aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
                aria-expanded={open}
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 text-white border border-white/15 rounded-full px-4 py-2 hover:border-tuna-gold hover:shadow-goldGlow hover:bg-white/5 transition-all"
              >
                <Menu size={20} />
                <span className="hidden sm:inline text-sm">Menü</span>
              </button>
            </div>
          </nav>
        </header>
      </div>

      <HamburgerMenu open={open} onClose={() => setOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
