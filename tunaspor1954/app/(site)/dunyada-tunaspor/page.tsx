"use client";

import { useEffect, useState } from "react";
import { COUNTRIES, equirectangularPosition } from "@/lib/countries";

interface CountryStat {
  code: string;
  count: number;
}

export default function DunyadaTunasporPage() {
  const [countries, setCountries] = useState<CountryStat[]>([]);
  const [totalCountries, setTotalCountries] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/visitor-map")
      .then((r) => r.json())
      .then((data) => {
        setCountries(data.countries ?? []);
        setTotalCountries(data.totalCountries ?? 0);
        setTotalVisitors(data.totalVisitors ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxCount = Math.max(1, ...countries.map((c) => c.count));

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <p className="eyebrow mb-3">Tunaspor 1954</p>
      <h1 className="font-display text-4xl mb-2">Dünyadaki Tunaspor</h1>
      <p className="text-tuna-mist max-w-2xl mb-4">
        Sitemizi hangi ülkelerden takip ediyorsunuz? Aşağıdaki harita, ziyaretçilerimizin geldiği
        ülkeleri gösteriyor.
      </p>
      <p className="text-xs text-tuna-mist/70 max-w-2xl mb-10">
        Not: Gizlilik gereği yalnızca ülke bazında toplu (anonim) veriler gösterilir — hiçbir
        ziyaretçinin kimliği veya tam konumu tutulmaz/gösterilmez.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-10 max-w-md">
        <div className="glass-panel p-6 text-center">
          <div className="text-3xl font-display text-tuna-gold">{totalCountries}</div>
          <div className="text-xs text-tuna-mist mt-1">Ülke</div>
        </div>
        <div className="glass-panel p-6 text-center">
          <div className="text-3xl font-display text-tuna-gold">{totalVisitors}</div>
          <div className="text-xs text-tuna-mist mt-1">Ziyaretçi</div>
        </div>
      </div>

      {/* Stilize dünya haritası — coğrafi olarak birebir değil, kıtaları temsili
          gösteren dekoratif bir zemin üzerine, ülkelerin GERÇEK enlem/boylamına göre
          konumlandırılmış noktalar bindirilir. */}
      <div className="glass-panel p-4 mb-12 overflow-hidden">
        <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-gradient-to-b from-[#0a1628] to-[#0d1f1a]">
          {/* Temsili kıta blob'ları (dekoratif) */}
          <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <ellipse cx="20" cy="18" rx="9" ry="7" fill="#FFD700" />
            <ellipse cx="27" cy="30" rx="6" ry="10" fill="#FFD700" />
            <ellipse cx="50" cy="15" rx="10" ry="6" fill="#FFD700" />
            <ellipse cx="53" cy="28" rx="7" ry="9" fill="#FFD700" />
            <ellipse cx="75" cy="18" rx="14" ry="9" fill="#FFD700" />
            <ellipse cx="85" cy="35" rx="6" ry="5" fill="#FFD700" />
          </svg>

          {/* Ülke noktaları */}
          {!loading &&
            countries.map((c) => {
              const info = COUNTRIES[c.code];
              if (!info) return null;
              const { xPct, yPct } = equirectangularPosition(info.lat, info.lng);
              const size = 8 + (c.count / maxCount) * 20;
              return (
                <div
                  key={c.code}
                  className="absolute group/dot"
                  style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div
                    className="rounded-full bg-tuna-gold animate-pulse cursor-pointer"
                    style={{
                      width: size,
                      height: size,
                      boxShadow: "0 0 12px rgba(255,215,0,0.7)",
                    }}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 -top-9 hidden group-hover/dot:block bg-tuna-black border border-tuna-gold/40 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {info.flag} {info.name} — {c.count}
                  </div>
                </div>
              );
            })}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-tuna-mist text-sm">
              Yükleniyor...
            </div>
          )}
        </div>
      </div>

      {/* Sıralı ülke listesi */}
      <section>
        <h2 className="font-display text-2xl mb-6">Ülkelere Göre Ziyaretçi Sıralaması</h2>
        <div className="space-y-1">
          {countries.map((c, i) => {
            const info = COUNTRIES[c.code];
            return (
              <div key={c.code} className="glass-panel px-4 py-3 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="text-tuna-mist w-6 text-sm">{i + 1}.</span>
                  <span className="text-xl">{info?.flag ?? "🏳️"}</span>
                  <span>{info?.name ?? c.code}</span>
                </span>
                <span className="font-display text-tuna-gold">{c.count}</span>
              </div>
            );
          })}
          {!loading && !countries.length && (
            <p className="text-tuna-mist">Henüz yeterli veri toplanmadı — trafik arttıkça harita dolacak.</p>
          )}
        </div>
      </section>
    </div>
  );
}
