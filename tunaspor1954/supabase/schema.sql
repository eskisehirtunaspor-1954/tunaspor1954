-- TUNASPOR 1954 — VERİTABANI ŞEMASI
-- Postgres (Supabase) — RLS her tabloda aktif, admin yazma yalnızca service_role veya
-- admin_users tablosunda karşılığı olan JWT üzerinden yapılır.

create extension if not exists "pgcrypto";

-- ========== YÖNETİCİ HESAPLARI & ROLLER ==========
do $$ begin
  create type admin_role as enum ('super_admin','editor','content_manager','coach');
exception when duplicate_object then null;
end $$;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  role admin_role not null default 'editor',
  totp_secret text,
  totp_enabled boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ========== TAKIMLAR / AKADEMİ ==========
do $$ begin
  create type team_category as enum (
    'a_takim','kadin_takimi','u18','u17','u16','u15','u14','u13','u12','u11','u10','u9'
  );
exception when duplicate_object then null;
end $$;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  category team_category not null unique,
  display_name text not null,
  coach_name text,
  description text,
  founded_year int,
  cover_image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  full_name text not null,
  position text,
  jersey_number int,
  birth_date date,
  height_cm int,
  weight_kg int,
  nationality text default 'TUR',
  photo_url text,
  bio text,
  stats jsonb default '{}'::jsonb, -- {mac, gol, asist, sarikart, kirmizikart}
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  full_name text not null,
  role text not null, -- Teknik Direktör, Antrenör, Kondisyoner, Malzemeci...
  photo_url text,
  bio text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== CANLI LİG DURUMU (tüm lig tablosu — rakip kulüpler dahil) ==========
create table if not exists league_table_rows (
  id uuid primary key default gen_random_uuid(),
  league_name text not null,
  season text not null,
  team_name text not null,
  is_own_team boolean not null default false,
  rank int not null,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  points int not null default 0,
  updated_at timestamptz not null default now()
);

-- ========== FİKSTÜR / PUAN DURUMU ==========
create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  opponent text not null,
  home_or_away text not null check (home_or_away in ('home','away')),
  match_date timestamptz not null,
  venue text,
  competition text,
  home_score int,
  away_score int,
  status text not null default 'scheduled' check (status in ('scheduled','live','finished','postponed')),
  created_at timestamptz not null default now()
);

create table if not exists standings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  league_name text not null,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  points int not null default 0,
  rank int,
  season text not null,
  updated_at timestamptz not null default now()
);

-- ========== HABERLER ==========
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_image_url text,
  team_id uuid references teams(id),
  author_id uuid references admin_users(id),
  is_published boolean not null default false,
  published_at timestamptz,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ========== GALERİ & VİDEO (Tunaspor TV) ==========
create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  team_id uuid references teams(id),
  media_type text not null default 'fotograf' check (media_type in ('fotograf','drone')),
  cover_image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Bu script'i daha önce çalıştırmış olanlar için güvenli migrasyon:
alter table gallery_albums add column if not exists media_type text not null default 'fotograf';
do $$ begin
  alter table gallery_albums drop constraint if exists gallery_albums_media_type_check;
  alter table gallery_albums add constraint gallery_albums_media_type_check
    check (media_type in ('fotograf','drone'));
exception when duplicate_object then null;
end $$;

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references gallery_albums(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int default 0
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_id text not null,
  team_id uuid references teams(id),
  is_published boolean not null default true,
  published_at timestamptz default now()
);

-- ========== ETKİNLİK & KAYIT SİSTEMİ ==========
do $$ begin
  create type event_type as enum ('yaz_kampi','turnuva','secme','seminer','etkinlik');
exception when duplicate_object then null;
end $$;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type event_type not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  capacity int,
  price numeric(10,2) default 0,
  cover_image_url text,
  registration_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  full_name text not null,
  birth_date date,
  parent_name text,
  phone text not null,
  email text,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','waitlisted')),
  created_at timestamptz not null default now()
);

-- ========== AKILLI KULÜP TAKVİMİ ==========
do $$ begin
  create type calendar_item_type as enum ('mac','antrenman','etkinlik','yaz_kampi','secme','duyuru');
exception when duplicate_object then null;
end $$;

create table if not exists calendar_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  type calendar_item_type not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

-- ========== ANTRENMAN TAKİBİ ==========
create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time,
  venue text,
  coach_id uuid references staff_members(id),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','rescheduled')),
  notes text,
  created_at timestamptz not null default now()
);

-- ========== DİJİTAL DESTEKÇİ DUVARI ==========
create table if not exists supporter_wall (
  id uuid primary key default gen_random_uuid(),
  supporter_name text not null,
  supporter_logo_url text,
  message text not null,
  is_approved boolean not null default false,
  approved_by uuid references admin_users(id),
  created_at timestamptz not null default now()
);

-- ========== SPONSORLAR ==========
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  website_url text,
  tier text default 'destekci' check (tier in ('ana_sponsor','platin','altin','destekci')),
  is_published boolean not null default true,
  sort_order int default 0
);

-- ========== İLETİŞİM ==========
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists contact_info (
  id int primary key default 1,
  address text,
  phone text,
  whatsapp_number text,
  whatsapp_channel_url text,
  email text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  map_lat numeric,
  map_lng numeric,
  check (id = 1)
);

-- ========== ÇOKLU DİL ==========
create table if not exists languages (
  code text primary key, -- tr, en, de, fr, es, it, ar, ru
  name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true
);

create table if not exists translations (
  id uuid primary key default gen_random_uuid(),
  namespace text not null, -- 'common','nav','home','news' vb.
  key text not null,
  lang_code text references languages(code),
  value text not null,
  unique (namespace, key, lang_code)
);

-- ========== SEO ==========
create table if not exists seo_settings (
  id uuid primary key default gen_random_uuid(),
  page_path text unique not null,
  meta_title text,
  meta_description text,
  keywords text,
  og_image_url text,
  twitter_card text default 'summary_large_image',
  schema_json jsonb,
  updated_at timestamptz not null default now()
);

-- ========== SİTE AYARLARI ==========
create table if not exists site_settings (
  id int primary key default 1,
  site_name text not null default 'Tunaspor 1954',
  logo_url text,
  primary_color text default '#FFD700',
  maintenance_mode boolean not null default false,
  founded_year int default 1954,
  social_links jsonb default '{}'::jsonb,
  atmosphere_mode text not null default 'otomatik'
    check (atmosphere_mode in ('otomatik','sabah','ogle','aksam','gece')),
  weather_mode text not null default 'otomatik'
    check (weather_mode in ('otomatik','acik','parcali_bulutlu','bulutlu','yagmurlu','karli','sisli','firtinali')),
  achievements_count int not null default 0,
  lightning_intensity text not null default 'orta'
    check (lightning_intensity in ('dusuk','orta','yuksek')),
  intro_mode text not null default 'once_per_session'
    check (intro_mode in ('once_per_session','always','disabled')),
  check (id = 1)
);

-- ========== AI ASİSTAN BİLGİ TABANI ==========
create table if not exists ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  content text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists ai_chat_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user','assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

-- ========== SOSYAL MEDYA AKIŞI (Instagram tarzı, admin yönetimli) ==========
do $$ begin
  create type social_platform as enum ('instagram','facebook','twitter','tiktok');
exception when duplicate_object then null;
end $$;

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  platform social_platform not null default 'instagram',
  image_url text not null,
  caption text,
  post_url text not null, -- gerçek Instagram/Facebook/X gönderisine dış link
  likes_count int default 0, -- kozmetik, admin elle girer
  is_published boolean not null default true,
  sort_order int default 0,
  published_at timestamptz not null default now()
);

alter table social_posts enable row level security;
drop policy if exists "public_read_published_social_posts" on social_posts;
create policy "public_read_published_social_posts" on social_posts for select using (is_published = true);

-- ========== PWA PUSH BİLDİRİM ABONELİKLERİ ==========
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ========== PERFORMANS / ANALİTİK ==========
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  session_id text,
  device_type text,
  referrer text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table teams enable row level security;
alter table players enable row level security;
alter table staff_members enable row level security;
alter table news enable row level security;
alter table gallery_albums enable row level security;
alter table gallery_photos enable row level security;
alter table videos enable row level security;
alter table sponsors enable row level security;
alter table events enable row level security;
alter table supporter_wall enable row level security;
alter table fixtures enable row level security;
alter table standings enable row level security;
alter table league_table_rows enable row level security;

-- Herkes yayınlanmış içeriği okuyabilir
drop policy if exists "public_read_published_teams" on teams;
create policy "public_read_published_teams" on teams for select using (is_published = true);
drop policy if exists "public_read_published_players" on players;
create policy "public_read_published_players" on players for select using (is_published = true);
drop policy if exists "public_read_published_staff" on staff_members;
create policy "public_read_published_staff" on staff_members for select using (is_published = true);
drop policy if exists "public_read_published_news" on news;
create policy "public_read_published_news" on news for select using (is_published = true);
drop policy if exists "public_read_published_gallery_albums" on gallery_albums;
create policy "public_read_published_gallery_albums" on gallery_albums for select using (is_published = true);
drop policy if exists "public_read_gallery_photos" on gallery_photos;
create policy "public_read_gallery_photos" on gallery_photos for select using (true);
drop policy if exists "public_read_published_videos" on videos;
create policy "public_read_published_videos" on videos for select using (is_published = true);
drop policy if exists "public_read_published_sponsors" on sponsors;
create policy "public_read_published_sponsors" on sponsors for select using (is_published = true);
drop policy if exists "public_read_events" on events;
create policy "public_read_events" on events for select using (true);
drop policy if exists "public_read_approved_supporter_wall" on supporter_wall;
create policy "public_read_approved_supporter_wall" on supporter_wall for select using (is_approved = true);
drop policy if exists "public_read_fixtures" on fixtures;
create policy "public_read_fixtures" on fixtures for select using (true);
drop policy if exists "public_read_standings" on standings;
create policy "public_read_standings" on standings for select using (true);
drop policy if exists "public_read_league_table" on league_table_rows;
create policy "public_read_league_table" on league_table_rows for select using (true);

-- Yazma işlemleri yalnızca service_role (API route'ları üzerinden, admin JWT doğrulandıktan sonra)
-- Bu nedenle insert/update/delete politikası tanımlanmadı; service_role RLS'yi bypass eder.

-- Varsayılan diller
insert into languages (code, name, is_default) values
  ('tr','Türkçe', true), ('en','English', false), ('de','Deutsch', false),
  ('fr','Français', false), ('es','Español', false), ('it','Italiano', false),
  ('ar','العربية', false), ('ru','Русский', false)
on conflict (code) do nothing;

-- ÖNEMLİ: site_settings ve contact_info tekil (id=1) satırları — bunlar olmadan
-- admin panelindeki "Site Ayarları" ve "İletişim Bilgileri" GET/PATCH işlemleri
-- boş/başarısız döner. Bu ekleme daha önce yanlışlıkla script'ten düşmüştü.
insert into site_settings (id) values (1) on conflict do nothing;
insert into contact_info (id) values (1) on conflict do nothing;

alter table contact_info add column if not exists whatsapp_channel_url text;

-- Bu script'i daha önce çalıştırmış olanlar için (tablo zaten varsa) güvenli migrasyon:
alter table site_settings add column if not exists atmosphere_mode text not null default 'otomatik';
alter table site_settings add column if not exists weather_mode text not null default 'otomatik';
alter table site_settings add column if not exists achievements_count int not null default 0;
alter table site_settings add column if not exists lightning_intensity text not null default 'orta';
alter table site_settings add column if not exists intro_mode text not null default 'once_per_session';

do $$ begin
  alter table site_settings drop constraint if exists site_settings_lightning_intensity_check;
  alter table site_settings add constraint site_settings_lightning_intensity_check
    check (lightning_intensity in ('dusuk','orta','yuksek'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table site_settings drop constraint if exists site_settings_intro_mode_check;
  alter table site_settings add constraint site_settings_intro_mode_check
    check (intro_mode in ('once_per_session','always','disabled'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table site_settings drop constraint if exists site_settings_atmosphere_mode_check;
  alter table site_settings add constraint site_settings_atmosphere_mode_check
    check (atmosphere_mode in ('otomatik','sabah','ogle','aksam','gece'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table site_settings drop constraint if exists site_settings_weather_mode_check;
  alter table site_settings add constraint site_settings_weather_mode_check
    check (weather_mode in ('otomatik','acik','parcali_bulutlu','bulutlu','yagmurlu','karli','sisli','firtinali'));
exception when duplicate_object then null;
end $$;
