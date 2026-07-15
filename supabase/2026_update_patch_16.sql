-- 2026 GÜNCELLEME YAMASI #16 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Antrenör/Personel Kart Sistemi genişletmesi ===
alter table staff_members add column if not exists uefa_license text; -- ör. "UEFA Pro", "UEFA A", "UEFA B", "UEFA C"
alter table staff_members add column if not exists specialization text; -- uzmanlık alanı
alter table staff_members add column if not exists achievements text; -- başarılar (serbest metin)
alter table staff_members add column if not exists teams_coached text; -- çalıştırdığı takımlar (kariyer, serbest metin)
alter table staff_members add column if not exists video_url text;
alter table staff_members add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table staff_members add column if not exists resume_pdf_url text;
alter table staff_members add column if not exists display_order int not null default 0;
