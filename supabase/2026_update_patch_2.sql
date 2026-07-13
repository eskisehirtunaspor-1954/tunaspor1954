-- 2026 GÜNCELLEME YAMASI #2 — Tunaspor 1954
-- Supabase SQL Editor'de, security_patch_enable_rls.sql VE 2026_update_patch.sql'DEN
-- SONRA çalıştır. Tamamen idempotent — birden fazla kez çalıştırılsa da güvenlidir.

-- === YAMA F: Oyuncu kartlarına yeni alanlar (lisans no / ayak tercihi / katılış tarihi) ===
alter table players add column if not exists license_no text;
alter table players add column if not exists preferred_foot text
  check (preferred_foot in ('sag', 'sol', 'cift'));
alter table players add column if not exists joined_at date;

-- === YAMA G: Medya yükleme için Storage bucket'ı ===
-- Yükleme her zaman kendi service-role API route'umuz (/api/admin/upload) üzerinden
-- yapılır (bu proje Supabase Auth kullanmadığı için storage RLS auth.uid() bazlı
-- politikalarla admin oturumumuzu tanımaz) — bucket public-read, yazma yalnızca
-- service-role ile yapıldığından ek bir INSERT policy'sine gerek yoktur.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- === YAMA H: Ortam sesleri — site geneli aç/kapat ===
alter table site_settings add column if not exists ambient_sound_enabled boolean not null default true;

-- === YAMA I: İletişim bilgileri güncelleme (adrese "Eskişehir" eklendi) ===
update contact_info set
  address = 'Zafer Mahallesi Egeli Sokak Eskişehir',
  contact_person = 'İsmail Demir',
  phone = '0532 428 25 49'
where id = 1;

-- Harita için yaklaşık Eskişehir merkez koordinatı — yalnızca hiç koordinat
-- girilmemişse uygulanır (coalesce), admin panelinden daha hassas bir konumla
-- her zaman güncellenebilir.
update contact_info set
  map_lat = coalesce(map_lat, 39.7767),
  map_lng = coalesce(map_lng, 30.5206)
where id = 1;
