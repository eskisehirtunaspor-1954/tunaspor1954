"use client";

import { useEffect, useState } from "react";

interface ScoutRow {
  id: string;
  club_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export default function ScoutlarPage() {
  const [scouts, setScouts] = useState<ScoutRow[]>([]);

  async function load() {
    const res = await fetch("/api/admin/scout-accounts");
    const data = await res.json();
    setScouts(data.data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function updateScout(id: string, updates: Partial<{ is_approved: boolean; is_active: boolean }>) {
    await fetch("/api/admin/scout-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    load();
  }

  const pending = scouts.filter((s) => !s.is_approved);
  const approved = scouts.filter((s) => s.is_approved);

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">Scout Başvuruları</h1>

      <h2 className="font-semibold mb-4">Onay Bekleyenler ({pending.length})</h2>
      <div className="space-y-2 mb-10">
        {pending.map((s) => (
          <div key={s.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{s.club_name}</p>
              <p className="text-xs text-tuna-mist">{s.contact_name} — {s.email} {s.phone && `— ${s.phone}`}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateScout(s.id, { is_approved: true })} className="text-sm text-tuna-yellow border border-tuna-yellow/30 px-3 py-1 rounded-full">
                Onayla
              </button>
              <button onClick={() => updateScout(s.id, { is_active: false })} className="text-sm text-red-400 border border-red-400/30 px-3 py-1 rounded-full">
                Reddet
              </button>
            </div>
          </div>
        ))}
        {!pending.length && <p className="text-tuna-mist">Bekleyen başvuru yok.</p>}
      </div>

      <h2 className="font-semibold mb-4">Onaylı Scout Hesapları ({approved.length})</h2>
      <div className="space-y-2">
        {approved.map((s) => (
          <div key={s.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{s.club_name}</p>
              <p className="text-xs text-tuna-mist">{s.contact_name} — {s.email}</p>
            </div>
            <button
              onClick={() => updateScout(s.id, { is_active: !s.is_active })}
              className={`text-sm px-3 py-1 rounded-full border ${s.is_active ? "text-red-400 border-red-400/30" : "text-tuna-yellow border-tuna-yellow/30"}`}
            >
              {s.is_active ? "Pasifleştir" : "Aktifleştir"}
            </button>
          </div>
        ))}
        {!approved.length && <p className="text-tuna-mist">Henüz onaylı scout yok.</p>}
      </div>
    </div>
  );
}
