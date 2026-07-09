"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface TeamCategory {
  key: string;
  label: string;
  subLinks: { href: string; label: string }[];
}

function academySubLinks(category: string) {
  return [
    { href: `/takimlar/${category}#kadro`, label: "Kadro" },
    { href: `/takimlar/${category}#antrenor-kadrosu`, label: "Antrenör Kadrosu" },
    { href: `/takimlar/${category}#galeri`, label: "Galeri" },
    { href: `/takimlar/${category}#puan-durumu`, label: "Puan Durumu" },
  ];
}

const A_TAKIM: TeamCategory = { key: "a_takim", label: "A Takım", subLinks: academySubLinks("a_takim") };

const ACADEMY_AGE_GROUPS: TeamCategory[] = ["u18", "u17", "u16", "u15", "u14", "u13", "u12", "u11", "u10", "u9"].map(
  (cat) => ({ key: cat, label: cat.toUpperCase(), subLinks: academySubLinks(cat) })
);

const KADIN_TAKIMI: TeamCategory = {
  key: "kadin_takimi",
  label: "Kadın Futbol Takımı",
  subLinks: [
    { href: "/takimlar/kadin_takimi#kadro", label: "Kadro" },
    { href: "/takimlar/kadin_takimi#haberler", label: "Haberler" },
    { href: "/takimlar/kadin_takimi#galeri", label: "Galeri" },
  ],
};

interface Props {
  open: boolean;
  onClose: () => void;
}

// Panel için ayrık giriş/çıkış davranışı: açılırken yaylı (spring) büyüme hissi,
// kapanırken yalnızca yumuşak bir fade — iki yönün "kişiliği" farklı, daha premium.
const panelVariants = {
  hidden: { x: "100%", opacity: 0, scale: 0.96, transition: { duration: 0.28, ease: "easeInOut" } },
  visible: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 } },
};

export function HamburgerMenu({ open, onClose }: Props) {
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [academyGroupOpen, setAcademyGroupOpen] = useState(false);
  const { t } = useI18n();
  const pathname = usePathname();

  const LINKS = [
    { href: "/", label: t("nav_home") },
    { href: "/kulubumuz", label: t("nav_about") },
    { href: "/haberler", label: t("nav_news") },
  ];
  const AFTER_TEAMS = [
    { href: "/tv", label: "Tunaspor TV+" },
    { href: "/forma-tasarim", label: "Forma Tasarla" },
    { href: "/mini-oyun", label: "Mini Oyun: Penaltı" },
    { href: "/dunyada-tunaspor", label: "Dünyadaki Tunaspor" },
    { href: "/magaza", label: "Kulüp Mağazası" },
    { href: "/veli/giris", label: "Veli Paneli" },
    { href: "/scout/giris", label: "Scout Paneli" },
    { href: "/lig-durumu", label: t("nav_standings") },
    { href: "/takvim", label: t("nav_calendar") },
    { href: "/etkinlikler", label: t("nav_events") },
    { href: "/galeri", label: t("nav_gallery") },
    { href: "/sponsorlar", label: t("nav_sponsors") },
    { href: "/iletisim", label: t("nav_contact") },
  ];

  const teamsActive = pathname?.startsWith("/takimlar");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Arka plan kararması */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-md"
          />

          {/* Sağdan açılan premium panel — blur artırıldı, spring giriş + fade çıkış */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-0 right-0 h-full z-50 w-[85%] sm:w-[60%] lg:w-[35%] bg-tuna-black/85 backdrop-blur-[32px] border-l border-tuna-gold/25 shadow-glass overflow-y-auto"
          >
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-tuna-gold-radial rounded-full pointer-events-none" />

            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 relative">
              <span className="font-display text-xl text-tuna-gold tracking-wide">MENÜ</span>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
                aria-label="Menüyü kapat"
                onClick={onClose}
                className="text-white hover:text-tuna-gold transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            <nav className="px-6 py-4 relative">
              <ul className="space-y-1">
                {LINKS.map((link) => (
                  <MenuLink key={link.href} href={link.href} label={link.label} onClose={onClose} active={pathname === link.href} />
                ))}

                {/* TAKIMLAR — akordeon */}
                <li>
                  <button
                    onClick={() => setTeamsExpanded((v) => !v)}
                    className={`w-full flex items-center justify-between py-3.5 border-b border-white/10 text-left transition-colors group ${
                      teamsActive ? "text-tuna-gold" : "hover:text-tuna-gold"
                    }`}
                  >
                    <span className="relative flex items-center gap-2">
                      {teamsActive && <span className="w-1 h-1 rounded-full bg-tuna-gold" />}
                      Takımlar
                      <span className="absolute left-0 -bottom-1 h-px w-0 bg-tuna-gold group-hover:w-full transition-all duration-300" />
                    </span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${teamsExpanded ? "rotate-180 text-tuna-gold" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {teamsExpanded && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden pl-4 bg-white/[0.02]"
                      >
                        {/* A Takım — kendi alt-linkleriyle ayrı açılır */}
                        <CategoryAccordionItem
                          category={A_TAKIM}
                          isOpen={expandedCategory === A_TAKIM.key}
                          onToggle={() => setExpandedCategory((c) => (c === A_TAKIM.key ? null : A_TAKIM.key))}
                          onClose={onClose}
                          pathname={pathname}
                        />

                        {/* Akademi — U18'den U9'a kadar her yaş grubu kendi başına açılır */}
                        <li>
                          <button
                            onClick={() => setAcademyGroupOpen((v) => !v)}
                            className="w-full flex items-center justify-between py-2.5 text-sm text-tuna-mist hover:text-tuna-gold transition-colors"
                          >
                            <span>Akademi</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${academyGroupOpen ? "rotate-180 text-tuna-gold" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {academyGroupOpen && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden pl-3"
                              >
                                {ACADEMY_AGE_GROUPS.map((cat) => (
                                  <CategoryAccordionItem
                                    key={cat.key}
                                    category={cat}
                                    isOpen={expandedCategory === cat.key}
                                    onToggle={() => setExpandedCategory((c) => (c === cat.key ? null : cat.key))}
                                    onClose={onClose}
                                    pathname={pathname}
                                  />
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </li>

                        {/* Kadın Futbol Takımı — kendi alt-linkleriyle ayrı açılır */}
                        <CategoryAccordionItem
                          category={KADIN_TAKIMI}
                          isOpen={expandedCategory === KADIN_TAKIMI.key}
                          onToggle={() => setExpandedCategory((c) => (c === KADIN_TAKIMI.key ? null : KADIN_TAKIMI.key))}
                          onClose={onClose}
                          pathname={pathname}
                        />
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>

                {AFTER_TEAMS.map((link) => (
                  <MenuLink key={link.href} href={link.href} label={link.label} onClose={onClose} active={pathname === link.href} />
                ))}
              </ul>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CategoryAccordionItem({
  category,
  isOpen,
  onToggle,
  onClose,
  pathname,
}: {
  category: TeamCategory;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  pathname: string | null;
}) {
  const categoryActive = pathname?.startsWith(`/takimlar/${category.key}`);

  return (
    <li>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-2.5 text-sm text-left transition-colors ${
          categoryActive ? "text-tuna-gold font-medium" : "text-tuna-mist hover:text-tuna-gold"
        }`}
      >
        <span>{category.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-tuna-gold" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden pl-3 bg-white/[0.02]"
          >
            {category.subLinks.map((sub) => (
              <li key={sub.href}>
                <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Link
                    href={sub.href}
                    onClick={onClose}
                    className="block py-2 text-xs text-tuna-mist/90 hover:text-tuna-gold transition-colors"
                  >
                    {sub.label}
                  </Link>
                </motion.div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function MenuLink({ href, label, onClose, active }: { href: string; label: string; onClose: () => void; active?: boolean }) {
  return (
    <li>
      <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
        <Link
          href={href}
          onClick={onClose}
          className={`group relative flex items-center gap-2 py-3.5 border-b border-white/10 transition-colors duration-200 ${
            active ? "text-tuna-gold" : "hover:text-tuna-gold"
          }`}
        >
          {active && <span className="w-1 h-1 rounded-full bg-tuna-gold" />}
          {label}
          <span
            className={`absolute left-0 -bottom-px h-px bg-tuna-gold transition-all duration-300 ${
              active ? "w-full" : "w-0 group-hover:w-full"
            }`}
          />
        </Link>
      </motion.div>
    </li>
  );
}
