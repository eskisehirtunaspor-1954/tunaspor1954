-- 2026 GÜNCELLEME YAMASI #6 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA W: Kulüp binası konumu için de "Harita Adı" alanı (saha_name ile simetrik) ===
alter table contact_info add column if not exists location_name text
  not null default 'Tunaspor 1954 Kulüp Binası';
