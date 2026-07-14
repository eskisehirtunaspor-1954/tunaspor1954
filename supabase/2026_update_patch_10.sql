-- 2026 GÜNCELLEME YAMASI #10 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Akademi Takip Sistemi genişletmesi ===

-- Lisans / sağlık / evrak durumu (players tablosuna eklenir)
alter table players add column if not exists license_status text not null default 'gecerli'
  check (license_status in ('gecerli','suresi_doldu','beklemede'));
alter table players add column if not exists license_expiry_date date;
alter table players add column if not exists health_status text not null default 'uygun'
  check (health_status in ('uygun','kontrol_gerekli','sakatlik'));
alter table players add column if not exists document_status text not null default 'tamamlandi'
  check (document_status in ('tamamlandi','eksik','beklemede'));

-- Maç kadroları — hangi oyuncu hangi maçta kadroya girdi + o maçtaki istatistikleri.
-- "Oynadığı maçlar" bilgisi bu tablonun fixtures ile birleştirilmesinden gelir.
create table if not exists match_squads (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  is_starting boolean not null default true,
  minutes_played int,
  goals int not null default 0,
  assists int not null default 0,
  yellow_card boolean not null default false,
  red_card boolean not null default false,
  created_at timestamptz not null default now(),
  unique (fixture_id, player_id)
);
alter table match_squads enable row level security;

-- Antrenör değerlendirmeleri — player_development_reports'un (serbest metin) aksine
-- yapısal puanlama (1-10) içerir, veli panelinde grafik olarak gösterilir.
create table if not exists player_coach_evaluations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  period_label text not null,
  technical_score int check (technical_score between 1 and 10),
  tactical_score int check (tactical_score between 1 and 10),
  physical_score int check (physical_score between 1 and 10),
  mental_score int check (mental_score between 1 and 10),
  comment text,
  created_at timestamptz not null default now()
);
alter table player_coach_evaluations enable row level security;

create index if not exists idx_match_squads_player_id on match_squads(player_id);
create index if not exists idx_match_squads_fixture_id on match_squads(fixture_id);
create index if not exists idx_player_coach_evaluations_player_id on player_coach_evaluations(player_id);
