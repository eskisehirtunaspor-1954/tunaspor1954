-- 2026 GÜNCELLEME YAMASI — Tunaspor 1954
-- Supabase SQL Editor'de, security_patch_enable_rls.sql'DEN SONRA çalıştır.
--
-- ÖNKOŞUL: Bu betik parent_accounts / training_attendance / player_development_reports /
-- academy_announcements gibi tabloların zaten var olduğunu varsayar (onlar
-- supabase/security_patch_enable_rls.sql içinde tanımlı). Canlı veritabanı kontrol
-- edildiğinde o dosyanın HİÇ çalıştırılmadığı görüldü — yani Veli Paneli, Aidatlar,
-- Devam Durumu ve Gelişim Raporları modülleri şu an tamamen bozuk (tablo yok hatası
-- veriyor). Önce security_patch_enable_rls.sql'i, sonra bu dosyayı çalıştır.

-- === YAMA 0 (KRİTİK — ÖNCE BUNU ÇALIŞTIR): anon rolüne eksik SELECT izni ===
-- Canlı veritabanına doğrudan bağlanıp test edildi: RLS policy'leri (schema.sql'deki
-- "public_read_published_*") doğru tanımlı, ama anon/authenticated Postgres
-- rollerine tablolar üzerinde temel SELECT GRANT'i hiç verilmemiş. Sonuç:
-- "permission denied for table teams/news/sponsors/players/contact_info/
-- site_settings/gallery_albums..." — yani PostgREST/anon key ile site ÖNYÜZÜNÜN
-- (createClient(), lib/supabase/server.ts) okuduğu HİÇBİR genel tablo şu an
-- veri döndürmüyor. Bu, "U kategorileri 404 veriyor" şikayetinin de asıl kök
-- nedenlerinden biri — sadece teams boş olması değil, anon'un okuma izni de
-- yoktu. RLS zaten satır bazlı filtrelemeyi (is_published=true vb.) sağladığı
-- için bu GRANT güvenlidir; admin_users/coach_accounts/parent_accounts gibi
-- RLS'i "deny-by-default" (policy'siz) tablolar bu GRANT'ten sonra bile anon'a
-- hiçbir satır döndürmez.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

-- === YAMA A: Antrenör Paneli — Veli Paneli ile birebir aynı izolasyon deseni ===
-- Antrenörler admin_users tablosunda DEĞİL, ayrı bir hesap tablosunda tutulur;
-- böylece /admin/login üzerinden asla giriş yapamazlar (Süper Admin dahil hiç kimse
-- admin oturumuyla antrenör paneline giremez — izolasyon burada, uygulama kodunda
-- middleware.ts'teki ayrı cookie kontrolüyle sağlanıyor).
create table if not exists coach_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
alter table coach_accounts enable row level security;

-- Bir antrenör birden fazla U kategorisine atanabilir (örn. hem U10 hem U11).
create table if not exists coach_team_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coach_accounts(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coach_id, team_id)
);
alter table coach_team_assignments enable row level security;

-- === YAMA B: İletişim sayfası — yetkili kişi alanı ===
alter table contact_info add column if not exists contact_person text;

-- === YAMA C: U kategorileri — teams tablosu boştu, 404'lerin gerçek sebebi buydu ===
-- Kod tarafı zaten doğru (/takimlar/[category] DB-driven); sadece veri eksikti.
insert into teams (category, display_name, is_published) values
  ('a_takim', 'A Takım', true),
  ('kadin_takimi', 'Kadın Futbol Takımı', true),
  ('u18', 'U18', true),
  ('u17', 'U17', true),
  ('u16', 'U16', true),
  ('u15', 'U15', true),
  ('u14', 'U14', true),
  ('u13', 'U13', true),
  ('u12', 'U12', true),
  ('u11', 'U11', true),
  ('u10', 'U10', true),
  ('u9', 'U9', true)
on conflict (category) do nothing;

-- === YAMA D: İletişim bilgileri güncelleme ===
update contact_info set
  address = 'Zafer Mahallesi Egeli Sokak',
  contact_person = 'İsmail Demir',
  phone = '0532 428 25 49'
where id = 1;

-- === YAMA E: Rol sadeleştirme — editor + content_manager -> tek "Yönetici" rolü ===
-- content_manager rolündeki hesaplar editor'a taşınır (yetkileri zaten aynıydı,
-- bkz. lib/auth.ts YONETICI_PERMISSIONS). coach rolündeki admin_users hesapları
-- yeni ayrı coach_accounts sistemine taşınmaz (farklı kimlik doğrulama akışı ve
-- veri modeli) — bu hesapları Süper Admin, yeni admin/dashboard/antrenorler
-- sayfasından yeniden antrenör hesabı olarak oluşturmalı.
update admin_users set role = 'editor' where role = 'content_manager';
