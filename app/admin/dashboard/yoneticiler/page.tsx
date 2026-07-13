"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string; email: string; full_name: string; role: string; is_active: boolean;
}

export default function Page() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "editor" });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/admin-users");
    const data = await res.json();
    setUsers(data.data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Oluşturulamadı.");
      return;
    }
    setQrCode(data.qrCodeDataUrl);
    // GÜVENLİK: hesap totp_enabled=false olarak oluşturuldu. Onay adımı için
    // email/şifre geçici olarak tutuluyor (yalnızca bu adım tamamlanana kadar, state'te).
    setPendingEmail(form.email);
    setPendingPassword(form.password);
    setForm({ email: "", password: "", full_name: "", role: "editor" });
    load();
  }

  async function handleConfirmTotp(e: React.FormEvent) {
    e.preventDefault();
    setConfirming(true);
    setConfirmError(null);
    const res = await fetch("/api/admin/auth/confirm-totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail, password: pendingPassword, token: confirmToken }),
    });
    setConfirming(false);
    const data = await res.json();
    if (!res.ok) {
      setConfirmError(data.error ?? "Doğrulanamadı.");
      return;
    }
    setBackupCodes(data.backupCodes);
    setQrCode(null);
    setPendingEmail(null);
    setPendingPassword(null);
    setConfirmToken("");
    load();
  }

  async function toggleActive(u: AdminUser) {
    await fetch("/api/admin/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, is_active: !u.is_active }),
    });
    load();
  }

  async function changeRole(u: AdminUser) {
    const nextRole = u.role === "super_admin" ? "editor" : "super_admin";
    if (!confirm(`${u.full_name} artık "${nextRole === "super_admin" ? "Süper Admin" : "Yönetici"}" olsun mu?`)) return;
    await fetch("/api/admin/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, role: nextRole }),
    });
    load();
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`${u.full_name} hesabını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    await fetch(`/api/admin/admin-users?id=${u.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">Yönetici Hesapları</h1>

      {/* Adım 1: QR göster, henüz 2FA aktif değil */}
      {qrCode && (
        <div className="glass-panel p-6 mb-8 text-center">
          <p className="text-sm text-tuna-mist mb-4">
            Hesap oluşturuldu ama henüz <strong>aktif değil</strong>. Bu QR kodu Google
            Authenticator ile taratıp uygulamada beliren 6 haneli kodu aşağıya gir —
            hesap ancak bu adım tamamlanınca giriş yapabilir hale gelir.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="TOTP QR" className="mx-auto rounded-lg mb-4" />

          <form onSubmit={handleConfirmTotp} className="flex gap-2 justify-center">
            <input
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="6 haneli kod"
              value={confirmToken}
              onChange={(e) => setConfirmToken(e.target.value.replace(/\D/g, ""))}
              className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow text-center tracking-widest"
            />
            <button disabled={confirming || confirmToken.length !== 6}
              className="bg-tuna-yellow text-tuna-black font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {confirming ? "Doğrulanıyor..." : "Onayla ve Aktifleştir"}
            </button>
          </form>
          {confirmError && <p className="text-red-400 text-sm mt-2">{confirmError}</p>}
        </div>
      )}

      {/* Adım 2: Onaylandı, yedek kodları bir kereliğine göster */}
      {backupCodes && (
        <div className="glass-panel p-6 mb-8">
          <p className="text-sm text-tuna-mist mb-3">
            ✅ 2FA aktif. Aşağıdaki yedek kodları güvenli bir yere kaydet — telefon
            kaybolursa bunlardan biriyle giriş yapılabilir. Bu kodlar bir daha gösterilmeyecek.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code) => (
              <code key={code} className="bg-black/40 rounded px-2 py-1 text-center">{code}</code>
            ))}
          </div>
          <button onClick={() => setBackupCodes(null)} className="mt-4 text-sm text-tuna-yellow">
            Kaydettim, kapat
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="glass-panel p-6 space-y-3 mb-10">
        <h2 className="font-semibold mb-2">Yeni Yönetici Ekle</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input required placeholder="Ad Soyad" value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
        <input required type="email" placeholder="E-posta" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
        <input required type="password" placeholder="Geçici Şifre (en az 12 karakter, büyük/küçük harf + rakam)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow">
          <option value="super_admin">Süper Admin</option>
          <option value="editor">Yönetici</option>
        </select>
        <button disabled={saving} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Oluşturuluyor..." : "Hesap Oluştur"}
        </button>
      </form>

      <h2 className="font-semibold mb-4">Mevcut Yöneticiler</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{u.full_name}</p>
              <p className="text-xs text-tuna-mist">
                {u.email} — {u.role === "super_admin" ? "Süper Admin" : "Yönetici"}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => changeRole(u)} className="text-sm text-tuna-gold">
                Rolü Değiştir
              </button>
              <button onClick={() => toggleActive(u)} className={`text-sm ${u.is_active ? "text-red-400" : "text-tuna-yellow"}`}>
                {u.is_active ? "Pasifleştir" : "Aktifleştir"}
              </button>
              <button onClick={() => handleDelete(u)} className="text-sm text-red-400">
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
