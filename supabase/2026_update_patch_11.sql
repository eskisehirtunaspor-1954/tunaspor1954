-- 2026 GÜNCELLEME YAMASI #11 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA: Ana sayfa harita sistemi genişletmesi ===
alter table contact_info add column if not exists map_description text;
alter table contact_info add column if not exists map_marker_icon text not null default 'club_logo'
  check (map_marker_icon in ('club_logo','football','pin_generic'));
alter table contact_info add column if not exists map_active boolean not null default true;

alter table contact_info add column if not exists saha_map_description text;
alter table contact_info add column if not exists saha_map_marker_icon text not null default 'football'
  check (saha_map_marker_icon in ('club_logo','football','pin_generic'));
alter table contact_info add column if not exists saha_map_active boolean not null default true;

update contact_info set
  location_name = 'Tunaspor 1954 Kulüp Merkezi',
  address = 'Zafer Mahallesi, Egeli Sokak, Tepebaşı / Eskişehir'
where id = 1;
