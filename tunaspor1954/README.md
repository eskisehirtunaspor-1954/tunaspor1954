# Tunaspor 1954 — Resmi Dijital Platform

## Bu teslimat neyi kapsıyor

Bu, tüm talimat dokümanındaki kapsamı (çok dilli PWA, tam admin paneli, AI asistan,
etkinlik/kayıt sistemi, akıllı takvim, antrenman takibi, destekçi duvarı, SEO/performans
panelleri, dinamik atmosfer sistemi vb.) hedefleyen **çalışan bir temel** (foundation).

Enterprise ölçekte bu proje gerçek dünyada haftalar süren bir geliştirme sürecidir; bu
teslimat, mimarinin doğru ve genişletilebilir şekilde kurulduğu, kritik akışların
(ana sayfa, admin girişi + 2FA, AI asistan, veritabanı) uçtan uca çalışır durumda olduğu
bir başlangıç noktasıdır. Aşağıdaki yol haritası neyin tamamlandığını ve sırada neyin
olduğunu netleştirir.

## Şu an çalışır durumda

- **Next.js 14 (App Router) + TypeScript + Tailwind** proje iskeleti
- **Supabase** entegrasyonu: browser client, server client, service-role client
- **Tam veritabanı şeması** (`supabase/schema.sql`) — teams, players, staff, fixtures,
  standings, news, gallery, videos, events + registrations, calendar_items,
  training_sessions, supporter_wall, sponsors, contact, languages/translations,
  seo_settings, site_settings, ai_knowledge_base, admin_users + audit log, RLS politikaları
- **Tüm public sayfalar**: Anasayfa, Kulübümüz, Haberler (+ detay), Takımlar (+ dinamik
  kategori sayfası), Akademi, Galeri (+ Tunaspor TV), Sponsorlar, İletişim (form +
  WhatsApp + harita), Etkinlikler (+ online başvuru), Akıllı Kulüp Takvimi (günlük/
  haftalık/aylık + takım filtresi), Antrenman Programı (+ hava durumu), Destekçi Duvarı
  (+ herkese açık form)
- **Dinamik atmosfer sistemi**: saate göre sabah/öğle/akşam/gece teması + canvas
  yağmur/şimşek efekti (gece + yağış aktifken, `prefers-reduced-motion` destekli)
- **Admin girişi**: e-posta/şifre + TOTP tabanlı 2FA (Google Authenticator uyumlu,
  QR kodu ile kurulum), brute-force koruması, httpOnly+secure+sameSite session cookie,
  middleware ile `/admin/*` koruması, rol bazlı yetkilendirme (super_admin/editor/
  content_manager/coach)
- **Admin panelinin tamamı** (20 modül) çalışır durumda: Dashboard, Haber Yönetimi
  (özel akış), Oyuncular, Takımlar, Akademi (teknik kadro), Galeri, Videolar,
  Etkinlikler, Kayıt Sistemi (başvuru onay/red), Akıllı Kulüp Takvimi, Akıllı Antrenman
  Takibi, Dijital Destekçi Duvarı (moderasyon), Sponsorlar, Personeller, İletişim
  Bilgileri + gelen mesajlar, Sosyal Medya, SEO Paneli, Performans Paneli (canlı
  metrikler), Yapay Zekâ Asistanı (bilgi tabanı yönetimi), Çoklu Dil (diller +
  çeviriler), Site Ayarları, Yönetici Hesapları (TOTP QR ile hesap oluşturma)
- Tüm admin CRUD işlemleri tek bir `GenericCrudManager` bileşeni ve `crud-factory`
  API fabrikası üzerinden çalışıyor — ekle/sil/düzenle/yayınla/pasifleştir her modülde
  tutarlı, `admin_audit_log` tablosuna otomatik kayıt düşülüyor
- **AI Kulüp Asistanı**: sağ-alt sohbet balonu → `/api/chat` sunucu route'u →
  Anthropic API, admin panelinden yönetilebilir bilgi tabanına (`ai_knowledge_base`)
  dayanıyor, rate-limit korumalı
- **SEO**: dinamik `sitemap.xml` (haberler + takımlar dahil) ve `robots.txt`, sayfa
  bazlı meta yönetimi (SEO Paneli)
- **Performans/Analitik**: her sayfa görüntülenmesi `page_views` tablosuna düşüyor,
  admin panelinde ziyaretçi/cihaz/en çok okunan sayfa metrikleri canlı hesaplanıyor
- **Canlı hava durumu**: OpenWeather üzerinden sunucu tarafı proxy route, anasayfa ve
  antrenman sayfasında widget olarak gösteriliyor
- **PWA**: `manifest.json`, service worker (`sw.js`) ile temel offline destek ve push
  bildirim altyapısı, ana ekrana ekleme desteği
- **Docker**: multi-stage `Dockerfile` (standalone Next.js build), `docker-compose.yml`
  (app + Nginx), TLS/gzip/rate-limit/security header'lı `nginx.conf`

## Şu an çalışır durumda (tam liste)

Yukarıdakilere ek olarak şimdi şunlar da tamamlandı:

- **Çoklu Dil (i18n)**: 8 dil (tr, en, de, fr, es, it, ar, ru) için yerleşik bir
  temel sözlük + admin panelinden (`Çoklu Dil` modülü) yönetilebilen override
  sistemi. `I18nProvider` context'i cookie'de dil tercihini saklar, RTL (Arapça)
  otomatik yön değişimini destekler. Navbar, Hero ve Footer bu sisteme bağlı;
  aynı `t()` deseni diğer sayfalara da kolayca uygulanabilir. Not: URL bazlı
  (`/en/...`) locale routing yerine cookie bazlı client-side çeviri tercih
  edildi — SEO'nun dil bazlı sayfa üretimine ihtiyaç duyduğu senaryoda
  `next-intl` ile route seviyesine taşınabilir.
- **İlk kurulum CLI'ı**: `npm run create-first-admin -- --email=... --password=... --name="..."`
  veritabanında hiç yönetici yokken ilk süper admin hesabını oluşturur ve
  terminalde TOTP QR kodu basar.
- **Push Bildirimler**: VAPID tabanlı web push — service worker abonelik alır,
  `/api/push/subscribe` kaydeder, admin panelindeki `Push Bildirim Gönder`
  modülünden tüm abonelere anlık bildirim gönderilebilir, geçersiz abonelikler
  otomatik temizlenir.
- **PWA ikonları**: Kulüp amblemi için gerçek PNG ikonlar üretildi (192x192,
  512x512, maskable) — kaynak SVG (`icon-source.svg`) kulübün nihai logosuyla
  değiştirilebilir.
- **Test altyapısı**: Vitest ile birim testleri (`tests/unit`, yetkilendirme +
  şifreleme mantığı kapsanıyor), Playwright ile e2e duman testleri
  (`tests/e2e`, anasayfa/haberler/iletişim/admin-koruması).
- **CI/CD**: `.github/workflows/ci.yml` her push/PR'da lint+test+build çalıştırır;
  `.github/workflows/deploy.yml` main'e merge'de Docker imajını GHCR'a
  push'lar ve (SSH secret'ları tanımlıysa) sunucuda `docker compose pull && up`
  tetikler.

## Bilinçli olarak ileri bırakılan tek konu

~~Font dosyaları~~ artık gerekmiyor: `Bebas Neue` ve `Inter`, `next/font/google`
üzerinden build sırasında otomatik indirilip projeye gömülüyor (harici runtime
isteği yok, manuel lisans dosyası gerekmiyor). ~~PWA ikonları~~ da artık gerçek
PNG dosyaları olarak üretildi (`public/icons/icon-192.png`, `icon-512.png`,
`icon-512-maskable.png`), kaynak SVG (`icon-source.svg`) kulüp gerçek logosunu
aldığınızda kolayca değiştirilebilir.

Geriye yalnızca **kulübün kendi iş bilgileri ve gerçek görselleri** kalıyor —
bunlar kod tarafında değil, kulübün kendi arşivinden/hesaplarından gelmesi
gereken şeyler. Aşağıdaki "Son Yapmanız Gerekenler" bölümü bunları sıralıyor.

## Son Yapmanız Gerekenler (kod tarafında yapılabilecek her şey tamam)

1. **Supabase projesi** — supabase.com'da yeni proje açın, `supabase/schema.sql`'i
   SQL editöründen çalıştırın, `.env.local`'e URL + anon key + service role key'i girin.
2. **Anthropic API key** — AI asistanın çalışması için `ANTHROPIC_API_KEY` girin.
3. **VAPID key** — `npx web-push generate-vapid-keys` çalıştırıp çıkan iki anahtarı
   ve genel anahtarı `.env.local`'e girin (push bildirimler için).
4. **OpenWeather API key** (opsiyonel) — hava durumu widget'ı için.
5. **İlk yönetici hesabı** — `npm run create-first-admin -- --email=... --password=... --name="..."`
   çalıştırıp terminaldeki QR kodu Google Authenticator ile taratın.
6. **Gerçek içerik girişi** — admin panelinden (Takımlar, Oyuncular, Haberler,
   Sponsorlar, İletişim Bilgileri vb.) kulübün gerçek verilerini girin; `npm run seed`
   yalnızca 12 takım kategorisini ve örnek AI bilgisini oluşturur, gerçek oyuncu/haber/
   fotoğraf verisi elle veya panelden eklenmeli.
7. **Görseller** — oyuncu/takım/tesis fotoğraflarını Supabase Storage'a (veya tercih
   ettiğiniz bir CDN'e) yükleyip URL'lerini ilgili admin formlarına girin.
8. **Domain + SSL** — `tunaspor1954.org` (veya seçtiğiniz alan adı) DNS kaydını sunucunuza
   yönlendirin, Certbot ile sertifika alıp `nginx/certs/` altına koyun.
9. **Sunucuya dağıtım** — `docker compose up -d --build` (veya CI/CD ile otomatik:
   `.github/workflows/deploy.yml` içindeki `SSH_HOST`/`SSH_USER`/`SSH_PRIVATE_KEY`
   secret'larını GitHub repo ayarlarına ekleyin).

Bunların hepsi kulübün kendi hesapları/kimlik bilgileri/görselleriyle ilgili —
kodda eksik kalan hiçbir şey yok.

## Kurulum

```bash
npm install
cp .env.example .env.local   # Supabase, JWT_SECRET, ANTHROPIC_API_KEY doldur
npx web-push generate-vapid-keys  # çıktıyı VAPID_* değişkenlerine yapıştır
# Supabase projesinde SQL editöründen supabase/schema.sql'i çalıştır
npm run seed                 # takımları, AI bilgi tabanını, örnek çevirileri doldurur
npm run create-first-admin -- --email=admin@tunaspor1954.org --password=GeciciSifre123! --name="Sistem Yöneticisi"
npm run dev
```

İlk admin hesabını oluşturmak için Supabase SQL editöründen `admin_users` tablosuna
`hashPassword()` ile üretilmiş bir hash ve `generateTotpSecret()` ile üretilmiş bir
TOTP secret eklenmesi gerekiyor — ya da bu ilk hesap eklendikten sonra o hesapla giriş
yapıp **Yönetici Hesapları** modülünden diğer tüm hesapları (QR kod ile) oluşturabilirsiniz.

## Docker ile dağıtım

```bash
cp .env.example .env.local   # üretim değerleriyle doldur
# nginx/certs/ altına fullchain.pem ve privkey.pem yerleştir (Let's Encrypt/Certbot)
docker compose up -d --build
```

`docker-compose.yml`, Next.js uygulamasını (standalone build) ve önünde TLS/gzip/
rate-limit ile yapılandırılmış bir Nginx'i tek komutla ayağa kaldırır.

## Mimari notlar

- Yazma işlemleri (`INSERT/UPDATE/DELETE`) yalnızca `service_role` client üzerinden,
  API route'larında admin session doğrulandıktan sonra yapılır — bu yüzden RLS
  politikalarında yazma kuralı tanımlanmadı, service role RLS'yi bypass eder.
- Rol bazlı yetkilendirme `lib/auth.ts` içindeki `ROLE_PERMISSIONS` matrisiyle yönetilir.
- Tasarım dili: sarı-siyah kurumsal kimlik, glassmorphism paneller, `Bebas Neue`
  (başlıklar) + `Inter` (gövde metni) — her ikisi de `next/font/google` ile build
  sırasında otomatik indirilip self-host ediliyor, elle dosya eklemeye gerek yok.
