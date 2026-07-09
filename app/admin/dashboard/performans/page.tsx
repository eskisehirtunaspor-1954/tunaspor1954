"use client";

import { useEffect, useState } from "react";

interface PerfData {
  todayViews: number;
  todayUniqueVisitors: number;
  allTimeTotal: number;
  totalViews: number;
  uniqueSessions: number;
  topPages: { path: string; count: number }[];
  deviceSplit: Record<string, number>;
  topNews: { title: string; view_count: number }[];
}

export default function Page() {
  const [data, setData] = useState<PerfData | null>(null);

  useEffect(() => {
    fetch("/api/admin/performance").then((r) => r.json()).then(setData);
    const interval = setInterval(() => {
      fetch("/api/admin/performance").then((r) => r.json()).then(setData);
    }, 60_000); // dakikada bir tazele — "ziyaretçi sayacı" canlı hissi versin
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="px-4 py-10 max-w-6xl mx-auto text-tuna-mist">Yükleniyor...</div>;

  const maxPage = Math.max(...data.topPages.map((p) => p.count), 1);
  const totalDevices = Object.values(data.deviceSplit).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-gold mb-8">Performans Paneli</h1>

      {/* ZİYARETÇİ SAYACI */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-5 text-center border border-tuna-gold/20">
          <div className="text-3xl font-display text-tuna-gold">{data.todayViews}</div>
          <div className="text-xs text-tuna-mist">Bugünkü Görüntülenme</div>
        </div>
        <div className="glass-panel p-5 text-center border border-tuna-gold/20">
          <div className="text-3xl font-display text-tuna-gold">{data.todayUniqueVisitors}</div>
          <div className="text-xs text-tuna-mist">Bugünkü Ziyaretçi</div>
        </div>
        <div className="glass-panel p-5 text-center border border-tuna-gold/20 col-span-2 md:col-span-1">
          <div className="text-3xl font-display text-tuna-gold">{data.allTimeTotal}</div>
          <div className="text-xs text-tuna-mist">Toplam Ziyaretçi (tüm zamanlar)</div>
        </div>
      </div>

      <p className="text-xs text-tuna-mist mb-3">Son 30 gün</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="glass-panel p-5 text-center">
          <div className="text-3xl font-display text-tuna-gold">{data.totalViews}</div>
          <div className="text-xs text-tuna-mist">Toplam Görüntülenme</div>
        </div>
        <div className="glass-panel p-5 text-center">
          <div className="text-3xl font-display text-tuna-gold">{data.uniqueSessions}</div>
          <div className="text-xs text-tuna-mist">Aktif Ziyaretçi</div>
        </div>
        {Object.entries(data.deviceSplit).map(([device, count]) => (
          <div key={device} className="glass-panel p-5 text-center">
            <div className="text-3xl font-display text-tuna-gold">
              {Math.round((count / totalDevices) * 100)}%
            </div>
            <div className="text-xs text-tuna-mist capitalize">{device}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 mb-10">
        <h2 className="font-semibold mb-4">En Çok Ziyaret Edilen Sayfalar (30 gün)</h2>
        <div className="space-y-2">
          {data.topPages.map((p) => (
            <div key={p.path} className="flex items-center gap-3 text-sm">
              <span className="w-40 truncate">{p.path}</span>
              <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-tuna-gold h-full rounded-full"
                  style={{ width: `${(p.count / maxPage) * 100}%` }}
                />
              </div>
              <span className="text-tuna-mist w-10 text-right">{p.count}</span>
            </div>
          ))}
          {!data.topPages.length && <p className="text-tuna-mist">Henüz veri yok.</p>}
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="font-semibold mb-4">En Çok Okunan Haberler</h2>
        <ul className="space-y-2 text-sm">
          {data.topNews.map((n, i) => (
            <li key={i} className="flex justify-between">
              <span>{n.title}</span>
              <span className="text-tuna-mist">{n.view_count} görüntülenme</span>
            </li>
          ))}
          {!data.topNews.length && <p className="text-tuna-mist">Henüz veri yok.</p>}
        </ul>
      </div>
    </div>
  );
}
