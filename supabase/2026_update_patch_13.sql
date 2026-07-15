-- 2026 GÜNCELLEME YAMASI #13 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Kulübümüz — dinamik organizasyon şeması + personel genişletmesi ===

alter table staff_members add column if not exists department text;
alter table staff_members add column if not exists phone text;
alter table staff_members add column if not exists email text;
alter table staff_members add column if not exists license_info text;
alter table staff_members add column if not exists start_date date;
alter table staff_members add column if not exists social_media jsonb not null default '{}'::jsonb;
alter table staff_members add column if not exists description text;

-- Sınırsız derinlikte, yönetici panelinden tamamen dinamik oluşturulan
-- organizasyon ağacı. "Kulübümüz" menüsü ve otomatik organizasyon şeması
-- bu tek tablodan üretilir.
create table if not exists org_nodes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references org_nodes(id) on delete cascade,
  title text not null,
  node_type text not null default 'baslik' check (node_type in ('baslik','personel','sayfa_baglantisi','metin')),
  staff_id uuid references staff_members(id) on delete set null,
  link_href text,
  content text,
  display_order int not null default 0,
  is_active boolean not null default true,
  is_hidden boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table org_nodes enable row level security;
create index if not exists idx_org_nodes_parent_id on org_nodes(parent_id);

-- Başkanın Mesajı — tekil (id=1) kayıt.
create table if not exists baskan_mesaji (
  id int primary key default 1,
  photo_url text,
  name text,
  title text,
  message text,
  video_url text,
  pdf_url text,
  gallery jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  check (id = 1)
);
insert into baskan_mesaji (id) values (1) on conflict do nothing;
alter table baskan_mesaji enable row level security;
