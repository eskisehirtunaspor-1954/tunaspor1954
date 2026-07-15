-- 2026 GÜNCELLEME YAMASI #14 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Ses Yönetimi — yönetici panelinden ses dosyası override sistemi ===
-- is_active=false olduğu sürece motor varsayılan /audio/{key}.mp3 dosyasını
-- kullanır; admin yeni bir dosya yükleyip aktif ederse o kullanılır.
create table if not exists sound_assets (
  key text primary key,
  file_url text,
  volume numeric(3,2) not null default 1.0,
  loop boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table sound_assets enable row level security;

insert into sound_assets (key, volume, loop, is_active) values
  ('background', 0.30, true, false),
  ('stadium-ambience', 0.35, true, false),
  ('crowd', 0.30, true, false),
  ('wolf-howl', 0.65, false, false),
  ('wind', 0.30, true, false),
  ('goal', 0.80, false, false),
  ('whistle', 0.70, false, false),
  ('click', 0.40, false, false),
  ('notification', 0.50, false, false),
  ('menu-open', 0.40, false, false),
  ('menu-close', 0.40, false, false),
  ('success', 0.60, false, false),
  ('error', 0.60, false, false)
on conflict (key) do nothing;
