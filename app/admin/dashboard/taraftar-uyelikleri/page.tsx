"use client";

import { useEffect, useState } from "react";

interface TaraftarRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  membership_no: string;
  membership_status: "aktif" | "pasif";
  membership_end_date: string | null;
  badge_tier: "bronz" | "gumus" | "altin" | "platin";
  is_active: boolean;
  created_at: string;
}

interface DueRow {
  id: string;
  taraftar_id: string;
  type: "aidat" | "bagis";
  amount: number;
  status: "odendi" | "bekliyor";
  payment_method: string | null;
  created_at: string;
  taraftar_accounts?: { full_name: string; membership_no: string };
}

const BADGE_OPTIONS = [
  { value: "bronz", label: "Bronz" },
  { value: "gumus", label: "Gümüş" },
  { value: "altin", label: "Altın" },
  { value: "platin", label: "Platin" },
];

export default function TaraftarUyelikleriPage() {
  const [accounts, setAccounts] = useState<TaraftarRow[]>([]);
  const [dues, setDues] = useState<DueRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newDueAmount, setNewDueAmount] = useState("");

  async function load() {
    const [accRes, duesRes] = await Promise.all([
      fetch("/api/admin/taraftar-accounts"),
      fetch("/api/admin/taraftar-dues"),
    ]);
    setAccounts((await accRes.json()).data ?? []);
    setDues((await duesRes.json()).data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function updateAccount(id: string, patch: Record<string, unknown>) {
    await fetch("/api/admin/taraftar-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    load();
  }

  async function addDue(taraftar_id: string) {
    const amount = parseFloat(newDueAmount);
    if (!amount || amount <= 0) return;
    await fetch("/api/admin/taraftar-dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taraftar_id, amount }),
    });
    setNewDueAmount("");
    load();
  }

  async function markDue(id: string, status: "odendi" | "bekliyor") {
    await fetch("/api/admin/taraftar-dues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, payment_method: status === "odendi" ? "elden" : null }),
    });
    load();
  }

  const filtered = accounts.filter(
    (a) =>
      !search ||
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.membership_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen px-4 py-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-2">Taraftar Üyelikleri</h1>
      <p className="text-sm text-tuna-mist mb-8">
        Taraftarlar kendi kendine üye olur — burada üyelik durumu, destekçi rozeti ve aidat/bağış
        kayıtları yönetilir. Ödemeler manuel olarak işaretlenir (çevrimiçi ödeme altyapısı bağlı değil).
      </p>

      <input
        placeholder="İsim veya üyelik no ile ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow mb-6"
      />

      <div className="space-y-3">
        {filtered.map((a) => {
          const accountDues = dues.filter((d) => d.taraftar_id === a.id);
          const isOpen = expanded === a.id;
          return (
            <div key={a.id} className="glass-panel p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-medium">{a.full_name}</p>
                  <p className="text-xs text-tuna-mist">
                    {a.membership_no} — {a.email ?? a.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={a.membership_status}
                    onChange={(e) => updateAccount(a.id, { membership_status: e.target.value })}
                    className="bg-white/5 rounded-lg px-2 py-1 text-sm border border-white/10"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pasif">Pasif</option>
                  </select>
                  <select
                    value={a.badge_tier}
                    onChange={(e) => updateAccount(a.id, { badge_tier: e.target.value })}
                    className="bg-white/5 rounded-lg px-2 py-1 text-sm border border-white/10"
                  >
                    {BADGE_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label} Rozet
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateAccount(a.id, { is_active: !a.is_active })}
                    className={`text-sm ${a.is_active ? "text-red-400" : "text-tuna-yellow"}`}
                  >
                    {a.is_active ? "Hesabı Askıya Al" : "Hesabı Etkinleştir"}
                  </button>
                  <button onClick={() => setExpanded(isOpen ? null : a.id)} className="text-sm text-tuna-mist hover:text-white">
                    {isOpen ? "Gizle" : "Aidat/Bağışlar"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  {accountDues.map((d) => (
                    <div key={d.id} className="text-sm flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span>
                        {d.type === "aidat" ? "Aidat" : "Bağış"} — {Number(d.amount).toLocaleString("tr-TR")} TL
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={d.status === "odendi" ? "text-green-400" : "text-tuna-gold"}>
                          {d.status === "odendi" ? "Ödendi" : "Bekliyor"}
                        </span>
                        {d.status === "bekliyor" ? (
                          <button onClick={() => markDue(d.id, "odendi")} className="text-xs text-green-400 hover:underline">
                            Ödendi İşaretle
                          </button>
                        ) : (
                          <button onClick={() => markDue(d.id, "bekliyor")} className="text-xs text-tuna-mist hover:underline">
                            Geri Al
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!accountDues.length && <p className="text-tuna-mist text-sm">Kayıt yok.</p>}

                  <div className="flex gap-2 pt-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Yeni aidat tutarı (TL)"
                      value={newDueAmount}
                      onChange={(e) => setNewDueAmount(e.target.value)}
                      className="flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-sm border border-white/10"
                    />
                    <button onClick={() => addDue(a.id)} className="bg-tuna-yellow text-tuna-black text-sm font-semibold px-4 rounded-lg">
                      Aidat Ekle
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!filtered.length && <p className="text-tuna-mist">Henüz taraftar üyeliği bulunmuyor.</p>}
      </div>
    </div>
  );
}
