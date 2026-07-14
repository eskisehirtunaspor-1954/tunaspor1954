-- 2026 GÜNCELLEME YAMASI #9 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Dijital Kulüp Merkezi — Taraftar (fan) üyelik sistemi ===
create table if not exists taraftar_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  password_hash text not null,
  full_name text not null,
  photo_url text,
  notification_preferences jsonb not null default '{"email":true,"push":true,"sms":false}'::jsonb,
  membership_no text unique not null,
  membership_status text not null default 'aktif' check (membership_status in ('aktif','pasif')),
  membership_start_date date not null default current_date,
  membership_end_date date,
  badge_tier text not null default 'bronz' check (badge_tier in ('bronz','gumus','altin','platin')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  constraint taraftar_accounts_contact_required check (email is not null or phone is not null)
);
alter table taraftar_accounts enable row level security;

create table if not exists taraftar_dues (
  id uuid primary key default gen_random_uuid(),
  taraftar_id uuid not null references taraftar_accounts(id) on delete cascade,
  type text not null check (type in ('aidat','bagis')),
  amount numeric(10,2) not null,
  status text not null default 'bekliyor' check (status in ('odendi','bekliyor')),
  payment_method text check (payment_method in ('havale','kapida_odeme','elden')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table taraftar_dues enable row level security;

create index if not exists idx_taraftar_dues_taraftar_id on taraftar_dues(taraftar_id);
