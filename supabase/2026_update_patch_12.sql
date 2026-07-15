-- 2026 GÜNCELLEME YAMASI #12 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Golden Wolf yapay zeka asistanı genişletmesi ===

create table if not exists ai_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table ai_faqs enable row level security;

create table if not exists ai_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  file_type text not null check (file_type in ('pdf','word','excel')),
  content_summary text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table ai_documents enable row level security;

create table if not exists ai_settings (
  id int primary key default 1,
  assistant_name text not null default 'Golden Wolf',
  welcome_message text,
  system_message_extra text,
  banned_topics text,
  check (id = 1)
);
insert into ai_settings (id) values (1) on conflict do nothing;
