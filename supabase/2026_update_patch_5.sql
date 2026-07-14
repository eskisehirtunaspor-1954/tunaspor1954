-- 2026 GÜNCELLEME YAMASI #5 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan (patch_4 dahil) SONRA çalıştır. İdempotent.

-- === YAMA N: Oyuncu kartı — veli iletişim + devamsızlık + aidat özeti ===
-- GÜVENLİK: bu alanlar yalnızca admin panelinden okunur/yazılır; herkese açık
-- takım kadrosu sorgusu (app/(site)/takimlar/[category]/page.tsx) bu kolonları
-- ASLA select etmez (select("*") yerine açık kolon listesi kullanılacak).
alter table players add column if not exists parent_name text;
alter table players add column if not exists parent_phone text;
alter table players add column if not exists parent_email text;
alter table players add column if not exists missed_trainings_count int not null default 0;
alter table players add column if not exists fee_paid_total numeric(10,2) not null default 0;
alter table players add column if not exists fee_balance numeric(10,2) not null default 0;
alter table players add column if not exists fee_last_payment_at date;

-- === YAMA O: Aidat hatırlatmasının tekrar tekrar gönderilmemesi için ===
alter table player_fees add column if not exists reminder_sent_at timestamptz;

-- === YAMA P: Push aboneliğini veliyle eşleştirme (hedefli push için şart) ===
alter table push_subscriptions add column if not exists parent_id uuid references parent_accounts(id) on delete cascade;

-- === YAMA R: Otomatik veli bildirimleri — site geneli aç/kapat ===
alter table site_settings add column if not exists notify_attendance_enabled boolean not null default true;
alter table site_settings add column if not exists notify_fees_enabled boolean not null default true;

-- === YAMA S: Bildirim şablonları (admin düzenleyebilir) ===
create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('antrenman_devamsizlik','aidat_hatirlatma','aidat_tesekkur','manuel')),
  channel text not null check (channel in ('push','email','whatsapp','sms')),
  subject text,
  body text not null,
  updated_at timestamptz not null default now(),
  unique (type, channel)
);
alter table notification_templates enable row level security;

-- === YAMA T: Veli bildirim gönderim geçmişi ===
create table if not exists parent_notifications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parent_accounts(id) on delete set null,
  player_id uuid references players(id) on delete set null,
  type text not null,
  channel text not null,
  subject text,
  body text not null,
  status text not null check (status in ('gonderildi','basarisiz','atlandi')),
  error text,
  created_at timestamptz not null default now()
);
alter table parent_notifications enable row level security;

-- === YAMA U: Forma Tasarım Stüdyosu — genişletilmiş alanlar ===
alter table jersey_designs add column if not exists kit_type text not null default 'ev_sahibi'
  check (kit_type in ('ev_sahibi','deplasman','kaleci','antrenman'));
alter table jersey_designs add column if not exists collar_type text not null default 'bisiklet'
  check (collar_type in ('bisiklet','polo','v_yaka'));
alter table jersey_designs add column if not exists sleeve_type text not null default 'kisa'
  check (sleeve_type in ('kisa','uzun'));
alter table jersey_designs add column if not exists shorts_color text;
alter table jersey_designs add column if not exists socks_color text;
alter table jersey_designs add column if not exists fabric text not null default 'klasik'
  check (fabric in ('mat','parlak','klasik'));
alter table jersey_designs add column if not exists logo_url text;
alter table jersey_designs add column if not exists sponsor_logo_url text;
alter table jersey_designs add column if not exists design_layout jsonb;
alter table jersey_designs add column if not exists owner_admin_id uuid references admin_users(id) on delete set null;

-- === YAMA V: Mini oyunlar — oyun türü ayrımı ===
alter table game_scores add column if not exists game_type text not null default 'penalti'
  check (game_type in ('penalti','serbest_vurus','kaleci_kurtaris','top_sektirme','slalom_dripling'));
