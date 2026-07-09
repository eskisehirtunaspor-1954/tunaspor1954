import Link from "next/link";

const MODULES = [
  { href: "/admin/dashboard/haberler", label: "Haber Yönetimi" },
  { href: "/admin/dashboard/oyuncular", label: "Oyuncular" },
  { href: "/admin/dashboard/takimlar", label: "Takımlar" },
  { href: "/admin/dashboard/akademi", label: "Akademi" },
  { href: "/admin/dashboard/galeri", label: "Galeri" },
  { href: "/admin/dashboard/videolar", label: "Videolar" },
  { href: "/admin/dashboard/etkinlikler", label: "Etkinlikler" },
  { href: "/admin/dashboard/lig-durumu", label: "Canlı Lig Durumu" },
  { href: "/admin/dashboard/kayitlar", label: "Kayıt Sistemi" },
  { href: "/admin/dashboard/takvim", label: "Akıllı Kulüp Takvimi" },
  { href: "/admin/dashboard/antrenman", label: "Akıllı Antrenman Takibi" },
  { href: "/admin/dashboard/destekci-duvari", label: "Dijital Destekçi Duvarı" },
  { href: "/admin/dashboard/sponsorlar", label: "Sponsorlar" },
  { href: "/admin/dashboard/personel", label: "Personeller" },
  { href: "/admin/dashboard/iletisim", label: "İletişim Bilgileri" },
  { href: "/admin/dashboard/sosyal-medya", label: "Sosyal Medya" },
  { href: "/admin/dashboard/sosyal-akis", label: "Sosyal Medya Akışı (Instagram Tarzı)" },
  { href: "/admin/dashboard/seo", label: "SEO Paneli" },
  { href: "/admin/dashboard/performans", label: "Performans Paneli" },
  { href: "/admin/dashboard/asistan", label: "Yapay Zekâ Asistanı" },
  { href: "/admin/dashboard/bildirimler", label: "Push Bildirim Gönder" },
  { href: "/admin/dashboard/dil", label: "Çoklu Dil Yönetimi" },
  { href: "/admin/dashboard/ayarlar", label: "Site Ayarları" },
  { href: "/admin/dashboard/yoneticiler", label: "Yönetici Hesapları" },
  { href: "/admin/dashboard/forma-tasarimlari", label: "Forma Tasarımları" },
  { href: "/admin/dashboard/oyun-skorlari", label: "Mini Oyun Skorları" },
  { href: "/admin/dashboard/veliler", label: "Veli Hesapları" },
  { href: "/admin/dashboard/aidatlar", label: "Aidatlar" },
  { href: "/admin/dashboard/gelisim-raporlari", label: "Gelişim Raporları" },
  { href: "/admin/dashboard/devam-durumu", label: "Antrenman Devam Durumu" },
  { href: "/admin/dashboard/akademi-duyurulari", label: "Akademi Duyuruları" },
  { href: "/admin/dashboard/urunler", label: "Mağaza Ürünleri" },
  { href: "/admin/dashboard/siparisler", label: "Siparişler" },
  { href: "/admin/dashboard/scoutlar", label: "Scout Başvuruları" },
  { href: "/admin/dashboard/scout-talepleri", label: "Scout İletişim Talepleri" },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">Yönetim Paneli</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="glass-panel p-5 hover:border-tuna-yellow/60 transition">
            <span className="text-sm font-medium">{m.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
