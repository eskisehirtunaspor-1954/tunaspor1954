-- GÜVENLİK YAMASI: Eksik Row Level Security aktivasyonları
-- Bu tablolarda RLS hiç aktif değildi, yani NEXT_PUBLIC_SUPABASE_ANON_KEY ile
-- herkes Supabase REST API'sinden bu tabloları doğrudan okuyup/yazabilirdi.
--
-- Hiçbir policy eklenmiyor (deny-by-default) — bu yüzden:
-- - service_role (server tarafındaki createServiceClient) RLS'i zaten bypass eder,
--   yani mevcut admin panel / API rotaları AYNEN çalışmaya devam eder.
-- - anon/authenticated key ile bu tablolara artık hiç erişilemez.
--
-- Kontrol edildi: projede bu tablolara client-side (anon key) erişen hiçbir kod yok,
-- bu yüzden bu değişiklik hiçbir mevcut özelliği bozmaz.
--
-- Supabase SQL Editor'de çalıştır.

alter table admin_users enable row level security;
alter table admin_audit_log enable row level security;
alter table ai_chat_logs enable row level security;
alter table ai_knowledge_base enable row level security;
alter table calendar_items enable row level security;
alter table contact_info enable row level security;
alter table contact_messages enable row level security;
alter table event_registrations enable row level security;
alter table languages enable row level security;
alter table page_views enable row level security;
alter table push_subscriptions enable row level security;
alter table seo_settings enable row level security;
alter table site_settings enable row level security;
alter table training_sessions enable row level security;
alter table translations enable row level security;

-- Not: İleride bu tablolardan herhangi birine public/anon taraftan okuma
-- eklemen gerekirse (örn. site ayarlarını client component'ten çekmek gibi),
-- diğer tablolarda kullanılan "public_read_..." desenine benzer, spesifik bir
-- policy eklemen yeterli. Şu an hiçbiri client'tan sorgulanmadığı için gerek yok.

-- === İKİNCİ YAMA: TOTP kurulumunu güvenli hale getirme ===
-- Yeni admin oluşturulduğunda artık totp_enabled=false ile başlıyor (bkz. create-admin
-- route güncellemesi). Yönetici QR'ı tarayıp ilk kodu doğru girene kadar hesap 2FA
-- olarak "aktif" sayılmıyor. Onay anında 10 yedek kod üretiliyor (hash'lenmiş saklanıyor).
alter table admin_users add column if not exists totp_backup_codes text[];

-- === ÜÇÜNCÜ YAMA: Tunaspor TV+ için video kategorisi ===
alter table videos add column if not exists category text not null default 'mac_ozeti'
  check (category in ('mac_ozeti','roportaj','antrenman','canli_yayin'));

-- === DÖRDÜNCÜ YAMA: Forma Tasarım Aracı ===
-- Taraftarlar kendi sarı-siyah forma tasarımlarını yapıp gönderir, admin onayından
-- sonra herkese görünür ve oylanabilir hale gelir (supporter_wall ile aynı desen).
create table if not exists jersey_designs (
  id uuid primary key default gen_random_uuid(),
  designer_name text not null,
  primary_color text not null,
  secondary_color text not null,
  pattern text not null default 'duz' check (pattern in ('duz','cizgili','capraz')),
  player_name text,
  player_number text,
  votes int not null default 0,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table jersey_designs enable row level security;

-- Aynı kişi/IP'nin aynı tasarıma birden fazla oy vermesini engellemek için
create table if not exists jersey_design_votes (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references jersey_designs(id) on delete cascade,
  voter_ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (design_id, voter_ip_hash)
);
alter table jersey_design_votes enable row level security;

-- === BEŞİNCİ YAMA: Mini Futbol Oyunu (Penaltı) — haftalık liderlik tablosu ===
create table if not exists game_scores (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  score int not null check (score >= 0 and score <= 5),
  created_at timestamptz not null default now()
);
alter table game_scores enable row level security;

-- Oy sayısını atomik (race condition'sız) artırmak için
create or replace function increment_jersey_votes(design_id_input uuid)
returns int as $$
declare
  new_votes int;
begin
  update jersey_designs set votes = votes + 1 where id = design_id_input
    returning votes into new_votes;
  return new_votes;
end;
$$ language plpgsql;

-- === ALTINCI YAMA: Dünyadaki Tunaspor — ülke bazlı ziyaretçi haritası ===
-- Gizlilik notu: tekil ziyaretçinin hassas/tam konumu DEĞİL, yalnızca ülke kodu
-- tutuluyor (örn. "TR", "DE") — bu, standart web analitiğinde (Google Analytics vb.)
-- kullanılan seviyede, kişiyi tanımlamayan toplu (aggregate) bir veridir.
alter table page_views add column if not exists country_code text;

-- === YEDİNCİ YAMA: Veli Paneli ===
-- Veliler kendi kendine kayıt OLAMAZ — hesabı ve çocuk eşleştirmesini yalnızca
-- admin (süper yönetici) oluşturur. Bu, birinin başka birinin çocuğunun
-- verisine (devam durumu, gelişim raporu, aidat) erişmesini engellemek için kritik.
create table if not exists parent_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
alter table parent_accounts enable row level security;

create table if not exists parent_player_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parent_accounts(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  unique (parent_id, player_id)
);
alter table parent_player_links enable row level security;

create table if not exists training_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  status text not null default 'katildi' check (status in ('katildi','katilmadi','izinli')),
  note text,
  unique (session_id, player_id)
);
alter table training_attendance enable row level security;

create table if not exists player_development_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  period_label text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table player_development_reports enable row level security;

create table if not exists player_fees (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  period_label text not null,
  amount numeric(10,2) not null,
  is_paid boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);
alter table player_fees enable row level security;

create table if not exists academy_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table academy_announcements enable row level security;

-- === SEKİZİNCİ YAMA: Kulüp Mağazası ===
-- NOT: Gerçek online kart ödemesi YOK (ödeme sağlayıcısı seçimi + sözleşme
-- gerektirir). Sipariş alınır, admin panelinden takip edilip ödeme
-- havale/kapıda ödeme ile manuel onaylanır.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('forma','atki','tisort')),
  price numeric(10,2) not null,
  image_url text,
  sizes text[] default '{}',
  stock int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table products enable row level security;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  items jsonb not null,
  total_amount numeric(10,2) not null,
  payment_method text not null check (payment_method in ('havale','kapida_odeme')),
  status text not null default 'beklemede' check (status in ('beklemede','onaylandi','kargoda','teslim_edildi','iptal')),
  created_at timestamptz not null default now()
);
alter table orders enable row level security;

-- === DOKUZUNCU YAMA: Scout Paneli ===
-- Kulüpler kendi kendine BAŞVURU yapabilir ama admin onaylamadan (is_approved)
-- giriş yapamaz — aksi halde herkes "scout"muş gibi davranıp oyuncu verisine
-- (iletişim, video, gelişim bilgisi) erişebilirdi.
create table if not exists scout_accounts (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  contact_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  is_approved boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
alter table scout_accounts enable row level security;

create table if not exists scout_watchlist (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid not null references scout_accounts(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (scout_id, player_id)
);
alter table scout_watchlist enable row level security;

create table if not exists scout_contact_requests (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid not null references scout_accounts(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);
alter table scout_contact_requests enable row level security;




