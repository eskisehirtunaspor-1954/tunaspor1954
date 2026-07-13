-- 2026 GÜNCELLEME YAMASI #3 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan (2026_update_patch_2.sql dahil) SONRA
-- çalıştır. Tamamen idempotent.

-- === YAMA J: Haberlere video eki ===
alter table news add column if not exists video_url text;

-- === YAMA K: Haberlere PDF/DOCX belge ekleri (bire-çok) ===
create table if not exists news_attachments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references news(id) on delete cascade,
  file_url text not null,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);
alter table news_attachments enable row level security;
-- gallery_photos ile aynı desen: alt tablo herkese açık okunur, yayın kontrolü
-- üst kayıt (news.is_published) sorgu tarafında zaten yapılıyor.
drop policy if exists "public_read_news_attachments" on news_attachments;
create policy "public_read_news_attachments" on news_attachments for select using (true);

-- === YAMA L: İkinci konum — Ediz Bahtiyaroğlu Sahası ===
-- Kulüp binası konumu zaten contact_info.address/map_lat/map_lng'de tutuluyordu;
-- ana sayfadaki ikinci harita kartı için aynı tabloya saha_* alanları eklendi.
alter table contact_info add column if not exists saha_name text default 'Ediz Bahtiyaroğlu Sahası';
alter table contact_info add column if not exists saha_address text;
alter table contact_info add column if not exists saha_map_lat numeric;
alter table contact_info add column if not exists saha_map_lng numeric;
