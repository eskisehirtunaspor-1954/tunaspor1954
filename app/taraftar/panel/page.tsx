"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

interface Account {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  notification_preferences: { email?: boolean; push?: boolean; sms?: boolean };
  membership_no: string;
  membership_status: "aktif" | "pasif";
  membership_start_date: string;
  membership_end_date: string | null;
  badge_tier: "bronz" | "gumus" | "altin" | "platin";
}

interface Due {
  id: string;
  type: "aidat" | "bagis";
  amount: number;
  status: "odendi" | "bekliyor";
  payment_method: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
}

const BADGE_LABEL: Record<Account["badge_tier"], string> = {
  bronz: "Bronz Destekçi",
  gumus: "Gümüş Destekçi",
  altin: "Altın Destekçi",
  platin: "Platin Destekçi",
};

const BADGE_COLOR: Record<Account["badge_tier"], string> = {
  bronz: "text-amber-700 border-amber-700/50 bg-amber-700/10",
  gumus: "text-slate-300 border-slate-300/50 bg-slate-300/10",
  altin: "text-tuna-gold border-tuna-gold/50 bg-tuna-gold/10",
  platin: "text-cyan-200 border-cyan-200/50 bg-cyan-200/10",
};

function downloadReceipt(account: Account, due: Due) {
  import("jspdf").then(({ default: jsPDF }) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tunaspor 1954", 20, 20);
    doc.setFontSize(12);
    doc.text("Dijital Makbuz", 20, 30);
    doc.line(20, 34, 190, 34);
    doc.setFontSize(11);
    doc.text(`Üye: ${account.full_name}`, 20, 46);
    doc.text(`Üyelik No: ${account.membership_no}`, 20, 54);
    doc.text(`Tür: ${due.type === "aidat" ? "Aidat" : "Bağış"}`, 20, 62);
    doc.text(`Tutar: ${due.amount.toLocaleString("tr-TR")} TL`, 20, 70);
    doc.text(`Ödeme Yöntemi: ${due.payment_method ?? "belirtilmedi"}`, 20, 78);
    doc.text(`Tarih: ${due.paid_at ? new Date(due.paid_at).toLocaleDateString("tr-TR") : "-"}`, 20, 86);
    doc.save(`tunaspor-makbuz-${due.id.slice(0, 8)}.pdf`);
  });
}

export default function TaraftarPanelPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false });

  const [donationAmount, setDonationAmount] = useState("");
  const [donationMethod, setDonationMethod] = useState<"havale" | "kapida_odeme" | "elden">("havale");

  useEffect(() => {
    fetch("/api/taraftar/me")
      .then((r) => {
        if (r.status === 401) {
          router.push("/taraftar/giris");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setAccount(d.account);
        setDues(d.dues ?? []);
        setFullName(d.account.full_name);
        setPhone(d.account.phone ?? "");
        setPrefs({ email: true, push: true, sms: false, ...(d.account.notification_preferences ?? {}) });
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (!account) return;
    QRCode.toDataURL(`TUNASPOR1954-UYE-${account.membership_no}`, { margin: 1, width: 180 }).then(setQrDataUrl);
  }, [account]);

  async function handleLogout() {
    await fetch("/api/taraftar/auth/logout", { method: "POST" });
    router.push("/taraftar/giris");
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/taraftar/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone, notification_preferences: prefs }),
    });
    setSaving(false);
    setMessage(res.ok ? "Profil güncellendi." : "Güncelleme başarısız.");
    if (res.ok) setAccount((a) => (a ? { ...a, full_name: fullName, phone, notification_preferences: prefs } : a));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/taraftar/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Fotoğraf yüklenemedi.");
      return;
    }
    await fetch("/api/taraftar/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_url: data.url }),
    });
    setAccount((a) => (a ? { ...a, photo_url: data.url } : a));
  }

  async function handleDonationSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    const res = await fetch("/api/taraftar/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, payment_method: donationMethod }),
    });
    setSaving(false);
    if (res.ok) {
      const { data } = await res.json();
      setDues((d) => [data, ...d]);
      setDonationAmount("");
      setMessage("Bağış talebiniz alındı. Kulüp yönetimi ödemenizi onayladığında durumu güncellenecek.");
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-tuna-mist">Yükleniyor...</div>;
  }
  if (!account) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-2">Taraftar Paneli</p>
          <h1 className="font-display text-3xl">Hoş geldin, {account.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-tuna-mist hover:text-white border border-white/15 rounded-full px-4 py-2">
          Çıkış Yap
        </button>
      </div>

      {message && <div className="glass-panel p-4 mb-6 text-sm text-tuna-gold">{message}</div>}

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Dijital Üyelik Kartı */}
        <section className="glass-panel p-6 flex flex-col items-center text-center">
          <h2 className="font-display text-xl mb-4 self-start">Dijital Üyelik Kartı</h2>
          <div className="w-full max-w-xs rounded-2xl border border-tuna-gold/30 bg-gradient-to-br from-tuna-charcoal to-tuna-black p-5">
            <p className="font-display text-tuna-gold text-lg mb-1">TUNASPOR 1954</p>
            {account.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.photo_url} alt={account.full_name} className="w-16 h-16 rounded-full object-cover mx-auto my-3" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 mx-auto my-3" />
            )}
            <p className="font-semibold">{account.full_name}</p>
            <p className="text-xs text-tuna-mist mb-2">Üyelik No: {account.membership_no}</p>
            <span
              className={`inline-block text-[11px] px-2 py-0.5 rounded-full border mb-3 ${
                account.membership_status === "aktif" ? "text-green-400 border-green-400/40 bg-green-400/10" : "text-red-400 border-red-400/40 bg-red-400/10"
              }`}
            >
              {account.membership_status === "aktif" ? "Aktif Üye" : "Pasif"}
            </span>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR kod" className="mx-auto rounded-lg bg-white p-2" />
            )}
            <p className="text-[11px] text-tuna-mist mt-3">
              {new Date(account.membership_start_date).toLocaleDateString("tr-TR")}
              {account.membership_end_date && ` — ${new Date(account.membership_end_date).toLocaleDateString("tr-TR")}`}
            </p>
          </div>
          <span className={`mt-4 inline-block text-sm px-3 py-1.5 rounded-full border ${BADGE_COLOR[account.badge_tier]}`}>
            🏅 {BADGE_LABEL[account.badge_tier]}
          </span>
        </section>

        {/* Profil */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-xl mb-4">Profil Bilgileri</h2>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <label className="block">
              <span className="text-sm text-tuna-mist block mb-1">Profil Fotoğrafı</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm" />
            </label>
            <label className="block">
              <span className="text-sm text-tuna-mist block mb-1">Ad Soyad</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
              />
            </label>
            <label className="block">
              <span className="text-sm text-tuna-mist block mb-1">Telefon</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
              />
            </label>
            <div>
              <span className="text-sm text-tuna-mist block mb-1">Bildirim Tercihleri</span>
              <div className="flex gap-4 text-sm">
                {(["email", "push", "sms"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(prefs[k])}
                      onChange={(e) => setPrefs((p) => ({ ...p, [k]: e.target.checked }))}
                    />
                    {k === "email" ? "E-posta" : k === "push" ? "Push" : "SMS"}
                  </label>
                ))}
              </div>
            </div>
            <button disabled={saving} className="bg-tuna-gold text-tuna-black font-semibold px-5 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        </section>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Bağış Ekranı */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-xl mb-4">Bağış Yap</h2>
          <p className="text-xs text-tuna-mist mb-3">
            Şu anda çevrimiçi ödeme altyapımız bulunmuyor — bağış talebiniz kulüp yönetimine iletilir, ödeme alındığında durumu güncellenir.
          </p>
          <form onSubmit={handleDonationSubmit} className="space-y-3">
            <input
              type="number"
              min={1}
              step="0.01"
              placeholder="Tutar (TL)"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
            />
            <select
              value={donationMethod}
              onChange={(e) => setDonationMethod(e.target.value as typeof donationMethod)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
            >
              <option value="havale">Havale/EFT</option>
              <option value="kapida_odeme">Elden/Kapıda</option>
              <option value="elden">Kulüp Ofisinde</option>
            </select>
            <button className="bg-tuna-gold text-tuna-black font-semibold px-5 py-2 rounded-lg">Bağış Talebi Gönder</button>
          </form>
        </section>

        {/* Ödeme Geçmişi */}
        <section className="glass-panel p-6">
          <h2 className="font-display text-xl mb-4">Ödeme Geçmişi</h2>
          <div className="space-y-2">
            {dues.map((d) => (
              <div key={d.id} className="text-sm border-b border-white/10 pb-2 flex items-center justify-between gap-2">
                <div>
                  <span className="text-tuna-mist">{d.type === "aidat" ? "Aidat" : "Bağış"}</span>
                  <span className="ml-2">{Number(d.amount).toLocaleString("tr-TR")} TL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={d.status === "odendi" ? "text-green-400" : "text-tuna-gold"}>
                    {d.status === "odendi" ? "Ödendi" : "Bekliyor"}
                  </span>
                  {d.status === "odendi" && (
                    <button onClick={() => downloadReceipt(account, d)} className="text-xs text-tuna-gold hover:underline">
                      Makbuz İndir
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!dues.length && <p className="text-tuna-mist text-sm">Henüz bir ödeme kaydı bulunmuyor.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
