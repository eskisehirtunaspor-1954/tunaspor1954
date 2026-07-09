"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, Newspaper, User, Shield, Loader2 } from "lucide-react";

interface Results {
  news: { id: string; slug: string; title: string; excerpt: string | null }[];
  players: { id: string; full_name: string; position: string | null; teams: { category: string; display_name: string } | null }[];
  teams: { id: string; category: string; display_name: string }[];
}

const EMPTY: Results = { news: [], players: [], teams: [] };

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults(EMPTY);
    }
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults(EMPTY); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then(setResults)
        .finally(() => setLoading(false));
    }, 300); // debounce
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const hasResults = results.news.length || results.players.length || results.teams.length;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl glass-panel border border-tuna-gold/25 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={18} className="text-tuna-gold shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Haber, oyuncu veya takım ara..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {loading && <Loader2 size={16} className="animate-spin text-tuna-mist" />}
          <button aria-label="Aramayı kapat" onClick={onClose} className="text-tuna-mist hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 && (
            <p className="text-sm text-tuna-mist p-6 text-center">En az 2 karakter yazarak aramaya başlayın.</p>
          )}

          {query.trim().length >= 2 && !loading && !hasResults && (
            <p className="text-sm text-tuna-mist p-6 text-center">"{query}" için sonuç bulunamadı.</p>
          )}

          {!!results.teams.length && (
            <ResultGroup icon={Shield} label="Takımlar">
              {results.teams.map((t) => (
                <ResultLink key={t.id} href={`/takimlar/${t.category}`} onClick={onClose} title={t.display_name} />
              ))}
            </ResultGroup>
          )}

          {!!results.players.length && (
            <ResultGroup icon={User} label="Oyuncular">
              {results.players.map((p) => (
                <ResultLink
                  key={p.id}
                  href={p.teams ? `/takimlar/${p.teams.category}` : "/takimlar"}
                  onClick={onClose}
                  title={p.full_name}
                  subtitle={[p.position, p.teams?.display_name].filter(Boolean).join(" · ")}
                />
              ))}
            </ResultGroup>
          )}

          {!!results.news.length && (
            <ResultGroup icon={Newspaper} label="Haberler">
              {results.news.map((n) => (
                <ResultLink key={n.id} href={`/haberler/${n.slug}`} onClick={onClose} title={n.title} subtitle={n.excerpt ?? undefined} />
              ))}
            </ResultGroup>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ icon: Icon, label, children }: { icon: React.ComponentType<{ size?: number }>; label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-tuna-mist uppercase tracking-wide">
        <Icon size={13} /> {label}
      </div>
      <div className="pb-2">{children}</div>
    </div>
  );
}

function ResultLink({ href, onClick, title, subtitle }: { href: string; onClick: () => void; title: string; subtitle?: string }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-2 hover:bg-white/5 transition-colors">
      <p className="text-sm">{title}</p>
      {subtitle && <p className="text-xs text-tuna-mist line-clamp-1">{subtitle}</p>}
    </Link>
  );
}
