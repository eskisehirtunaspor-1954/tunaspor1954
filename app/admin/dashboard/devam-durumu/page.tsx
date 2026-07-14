"use client";

import { useEffect, useState } from "react";

interface Player {
  id: string;
  full_name: string;
  team_id: string;
  missed_trainings_count: number;
  fee_paid_total: number;
  fee_balance: number;
  fee_last_payment_at: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  is_published: boolean;
}

interface Team {
  id: string;
  display_name: string;
}

interface Fee {
  player_id: string;
  is_paid: boolean;
  due_date: string | null;
}

type Status = "green" | "yellow" | "red";

function computeStatus(player: Player, hasOverdueFee: boolean): Status {
  if (player.missed_trainings_count >= 4 || hasOverdueFee) return "red";
  if (player.missed_trainings_count >= 1 || player.fee_balance > 0) return "yellow";
  return "green";
}

const STATUS_STYLES: Record<Status, string> = {
  green: "border-emerald-400/50 bg-emerald-400/5",
  yellow: "border-amber-400/50 bg-amber-400/5",
  red: "border-red-400/50 bg-red-400/5",
};

const STATUS_LABEL: Record<Status, string> = {
  green: "🟢 Sorun yok",
  yellow: "🟡 Takip edilmeli",
  red: "🔴 Acil ilgilenilmeli",
};

// Bu sayfa salt okunur — devam durumu verisi izolasyon gereği yalnızca Antrenör
// Panelinden girilir (bkz. /antrenor/panel), aidat düzenlemesi "Aidatlar" modülünden
// yapılır. Burası admin/yöneticiye tek bakışta hangi oyuncunun ilgi beklediğini
// gösteren bir özet — renkli durum göstergeleriyle.
export default function OyuncuDurumuPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/players").then((r) => r.json()),
      fetch("/api/admin/teams").then((r) => r.json()),
      fetch("/api/admin/player-fees").then((r) => r.json()),
    ]).then(([p, t, f]) => {
      setPlayers(p.data ?? []);
      setTeams(t.data ?? []);
      setFees(f.data ?? []);
      setLoading(false);
    });
  }, []);

  const teamName = (id: string) => teams.find((t) => t.id === id)?.display_name ?? "—";
  const today = new Date().toISOString().slice(0, 10);
  const hasOverdue = (playerId: string) =>
    fees.some((f) => f.player_id === playerId && !f.is_paid && f.due_date && f.due_date < today);

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-2">Oyuncu Durumu</h1>
      <p className="text-sm text-tuna-mist mb-8">
        Devamsızlık ve aidat durumuna göre renkli özet — düzenlemek için{" "}
        <a href="/admin/dashboard/oyuncular" className="text-tuna-gold underline">Oyuncular</a> veya{" "}
        <a href="/admin/dashboard/aidatlar" className="text-tuna-gold underline">Aidatlar</a> modülünü kullanın.
      </p>

      {loading ? (
        <p className="text-tuna-mist">Yükleniyor...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.filter((p) => p.is_published).map((p) => {
            const overdue = hasOverdue(p.id);
            const status = computeStatus(p, overdue);
            return (
              <div key={p.id} className={`glass-panel border p-4 ${STATUS_STYLES[status]}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{p.full_name}</p>
                  <span className="text-xs">{STATUS_LABEL[status]}</span>
                </div>
                <p className="text-xs text-tuna-mist mb-3">{teamName(p.team_id)}</p>
                <div className="space-y-1 text-xs text-tuna-mist">
                  <p>Katılmadığı antrenman: <span className="text-white">{p.missed_trainings_count}</span></p>
                  <p>Ödenen aidat: <span className="text-white">{p.fee_paid_total.toLocaleString("tr-TR")} ₺</span></p>
                  <p>Kalan borç: <span className={p.fee_balance > 0 ? "text-red-300" : "text-white"}>{p.fee_balance.toLocaleString("tr-TR")} ₺</span></p>
                  {p.fee_last_payment_at && <p>Son ödeme: {new Date(p.fee_last_payment_at).toLocaleDateString("tr-TR")}</p>}
                </div>
                {(p.parent_name || p.parent_phone || p.parent_email) && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-tuna-mist">
                    <p className="text-tuna-gold mb-1">Veli</p>
                    {p.parent_name && <p>{p.parent_name}</p>}
                    {p.parent_phone && <p>{p.parent_phone}</p>}
                    {p.parent_email && <p>{p.parent_email}</p>}
                  </div>
                )}
              </div>
            );
          })}
          {!players.length && <p className="text-tuna-mist col-span-full">Henüz oyuncu eklenmedi.</p>}
        </div>
      )}
    </div>
  );
}
