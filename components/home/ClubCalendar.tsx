"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface CalendarEntry {
  id: string;
  type: string;
  title: string;
  start_time: string;
  location: string | null;
  competition?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  mac: "Maç", antrenman: "Antrenman", etkinlik: "Etkinlik",
  yaz_kampi: "Yaz Kampı", secme: "Seçme", duyuru: "Duyuru",
};

const TYPE_COLORS: Record<string, string> = {
  mac: "border-tuna-yellow", antrenman: "border-blue-400", etkinlik: "border-purple-400",
  yaz_kampi: "border-green-400", secme: "border-orange-400", duyuru: "border-tuna-mist",
};

export function ClubCalendar({ teams }: { teams: { id: string; display_name: string }[] }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"gunluk" | "haftalik" | "aylik">("haftalik");
  const [teamId, setTeamId] = useState<string>(() => searchParams.get("team") ?? "");
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = teamId ? `/api/calendar?team_id=${teamId}` : "/api/calendar";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setEntries(d.data ?? []))
      .finally(() => setLoading(false));
  }, [teamId]);

  const now = new Date();
  const rangeMs = view === "gunluk" ? 1 : view === "haftalik" ? 7 : 30;
  const rangeEnd = new Date(now.getTime() + rangeMs * 86_400_000);

  const filtered = entries.filter((e) => {
    const t = new Date(e.start_time);
    return t >= now && t <= rangeEnd;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        {(["gunluk", "haftalik", "aylik"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              view === v ? "bg-tuna-yellow text-tuna-black border-tuna-yellow" : "border-white/20 text-tuna-mist"
            }`}
          >
            {v === "gunluk" ? "Günlük" : v === "haftalik" ? "Haftalık" : "Aylık"}
          </button>
        ))}
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="ml-auto bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm outline-none"
        >
          <option value="">Tüm Takımlar</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.display_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-tuna-mist">Yükleniyor...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className={`glass-panel p-4 border-l-4 ${TYPE_COLORS[e.type] ?? "border-white/20"}`}>
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <span className="eyebrow">
                    {TYPE_LABELS[e.type] ?? e.type}
                    {e.competition && <span className="text-tuna-mist"> · {e.competition}</span>}
                  </span>
                  <p className="font-medium">{e.title}</p>
                  {e.location && <p className="text-xs text-tuna-mist">📍 {e.location}</p>}
                </div>
                <span className="text-sm text-tuna-mist">
                  {new Date(e.start_time).toLocaleString("tr-TR", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="text-tuna-mist">Bu aralıkta planlanmış bir etkinlik yok.</p>}
        </div>
      )}
    </div>
  );
}
