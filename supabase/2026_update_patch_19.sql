-- 2026 GÜNCELLEME YAMASI #19 — Tunaspor 1954
-- Ses Yönetimi altyapısını profesyonelleştirir: her ses için özel görünen ad
-- (custom_label) ve "Otomatik Başlat" (autoplay) alanı eklenir. Ayrıca
-- Akademi (U Kategorileri) altındaki yaş grubu düğümleri "U10 Antrenörleri"
-- tarzı adlandırmaya güncellenir (kullanıcının en güncel isteğine göre).

alter table sound_assets add column if not exists custom_label text;
alter table sound_assets add column if not exists autoplay boolean not null default false;

-- Sürekli/atmosfer katmanları sayfa açılışında otomatik başlasın; menü/buton/
-- bildirim/gol gibi olay bazlı sesler zaten kod içinde tetiklendiği için
-- "otomatik başlat" onlar için varsayılan olarak kapalı kalır.
update sound_assets set autoplay = true where key in ('background', 'wind', 'stadium-ambience', 'crowd', 'wolf-howl');

update sound_assets set custom_label = 'Açılış Kurt Uluması' where key = 'wolf-howl';
update sound_assets set custom_label = 'Taraftar Atmosferi' where key = 'stadium-ambience';
update sound_assets set custom_label = 'Tunaspor Tezahüratı' where key = 'crowd';
update sound_assets set custom_label = 'Gol Sesi' where key = 'goal';
update sound_assets set custom_label = 'Menü Açılma Sesi' where key = 'menu-open';
update sound_assets set custom_label = 'Buton Tıklama Sesi' where key = 'click';
update sound_assets set custom_label = 'Bildirim Sesi' where key = 'notification';

-- Akademi (U Kategorileri) yaş grubu adlandırması güncellendi.
update org_nodes set title = 'U10 Antrenörleri' where title = 'U10' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U11 Antrenörleri' where title = 'U11' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U12 Antrenörleri' where title = 'U12' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U13 Antrenörleri' where title = 'U13' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U14 Antrenörleri' where title = 'U14' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U15 Antrenörleri' where title = 'U15' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U16 Antrenörleri' where title = 'U16' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U17 Antrenörleri' where title = 'U17' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
update org_nodes set title = 'U18 Antrenörleri' where title = 'U18' and parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed';
