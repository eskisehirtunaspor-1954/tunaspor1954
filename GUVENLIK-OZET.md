# Güvenlik Güncellemeleri — Özet

Zip'i (`guvenlik-guncellemeleri.zip`) projenin köküne aç, dosyalar doğru yerlere yerleşecek (üzerine yazar).

## 1) SQL — Supabase'de çalıştır (`security_patch_enable_rls.sql`)
- **Kritik:** `admin_users` dahil 15 tabloda RLS hiç aktif değildi → herkes public anon key ile şifre hash'lerini ve TOTP secret'larını doğrudan Supabase REST API'sinden çekebilirdi. Artık kapalı.
- `admin_users` tablosuna `totp_backup_codes` kolonu eklendi.

## 2) TOTP kurulum akışı değişti (daha güvenli yöntem)
**Eskisi:** Yeni yönetici oluşturulunca `totp_enabled` direkt `true` oluyordu, QR gösterildikten sonra hiçbir doğrulama yoktu.
**Yenisi:**
- `create-admin` artık `totp_enabled: false` ile hesap açıyor.
- Yeni `confirm-totp` endpoint'i (`app/api/admin/auth/confirm-totp/route.ts`): yönetici QR'ı tarayıp authenticator'dan gelen ilk kodu + şifresini girmeden hesap aktifleşmiyor.
- Onay anında 10 tek kullanımlık **yedek kod** üretiliyor (hash'lenmiş saklanıyor, düz metin sadece o an bir kere gösteriliyor).
- `verify-totp` (login) artık normal TOTP kodunun yanında yedek kodu da kabul ediyor — telefon kaybolursa hesaba erişim var.
- `yoneticiler/page.tsx` arayüzü bu yeni akışa göre güncellendi: QR → kod gir → onayla → yedek kodları göster.

Neden bu daha güvenli: Eski yöntemde QR ekran görüntüsü yanlış kişiye ulaşırsa ya da tarama başarısız olursa hesap ya kilitli kalır ya da secret'i ilk yakalayan kişi kontrolü ele geçirir. Yeni yöntemde doğrulama yapılmadan hesap hiç aktifleşmiyor.

## 3) Şifre gücü zorunluluğu
`create-admin` artık en az 12 karakter + büyük/küçük harf + rakam zorunlu tutuyor (önceden hiç kontrol yoktu).

## 4) Brute-force / spam koruması eklendi
Önceden hiç limiti olmayan 5 public endpoint'e IP bazlı rate limit eklendi (`lib/rate-limit.ts` — ortak yardımcı):
- `contact` (iletişim formu)
- `event-registration`
- `supporter-wall`
- `push/subscribe`
- `track` (sayfa görüntüleme)

`verify-totp` login endpoint'ine de (daha önce hiç yoktu) 5 denemede 15 dk kilitleme eklendi.

## Dokunulmadığı için bilgin olsun
- CSP header'ında `unsafe-inline`/`unsafe-eval` var — sıkılaştırmak XSS'e karşı daha iyi olurdu ama hangi kütüphanenin buna ihtiyacı olduğunu build/test edemediğim için riskli, elleme dedim.
- `{login,verify-totp}` çöp klasörü hâlâ duruyor, zararsız.
- In-memory rate limit'ler (Map) tek sunucu instance'ında çalışır; birden fazla instance'a ölçeklenirse Redis gerekir (mevcut login limiter'ı da aynı durumda).
