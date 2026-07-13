// Bu modül, izolasyon gereği Antrenör Paneli'ne taşındı: gelişim raporları artık
// yalnızca /antrenor/panel üzerinden, antrenörün kendi atandığı takım(lar)daki
// oyuncular için yazılabilir (Süper Admin dahil hiçbir admin hesabı buradan
// erişemez — bkz. plan Faz 6b).
export default function Page() {
  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-4">Gelişim Raporları</h1>
      <p className="text-tuna-mist">
        Bu modül, izolasyon gereği artık yalnızca antrenörlerin kendi giriş yaptığı{" "}
        <span className="text-tuna-gold">Antrenör Paneli</span>'nden yönetiliyor.
        Antrenör hesabı oluşturmak/atamak için{" "}
        <a href="/admin/dashboard/antrenorler" className="text-tuna-gold underline">
          Antrenör Hesapları
        </a>{" "}
        sayfasını kullanın.
      </p>
    </div>
  );
}
