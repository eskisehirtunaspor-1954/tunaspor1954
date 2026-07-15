-- 2026 GÜNCELLEME YAMASI #17 — Tunaspor 1954
-- Kulübümüz organizasyon ağacını, patch_15'te seed edilen tek zincirden
-- (Başkan > Sportif Direktör > A Takım Antrenörleri > Akademi Direktörü > ...)
-- yeni dallanma şekline dönüştürür: Başkan ve Sportif Direktör kök seviyede
-- kardeş, Sportif Direktör'ün 6 isimli çocuğu, Akademi Koordinatörü kendi
-- kökünde U10-U18 Antrenörü çocuklarıyla, Kadın Futbol Takımı Antrenörü
-- çocuksuz kök. Hiçbir mevcut düğüm kalıcı silinmez (yalnızca 1 artık sarmalayıcı
-- düğüm yumuşak silinir — "Silinenler" bölümünden geri yüklenebilir); Doktor/
-- Fizyoterapist/Malzeme Sorumlusu zinciri kaybolmadan Sportif Direktör'ün
-- altına taşınır. İdempotent değildir — yalnızca bir kez, mevcut canlı ID'lere
-- karşı çalıştırılmak üzere yazıldı.

-- 1) Sportif Direktör artık Başkan'ın çocuğu değil, kök seviyede kardeşi.
update org_nodes set parent_id = null
  where id = '11454d7c-aee1-4a09-9e75-566cd01b2e7a';

-- 2) "A Takım Antrenörleri" -> "A Takım Teknik Direktörü" (Sportif Direktör'ün ilk çocuğu).
update org_nodes set title = 'A Takım Teknik Direktörü', display_order = 0
  where id = 'da1da265-456d-474a-a044-084b29e82949';

-- 3) Sportif Direktör'ün diğer 5 isimli çocuğu (yalnızca daha önce eklenmedilerse).
insert into org_nodes (parent_id, title, node_type, display_order, is_active, is_hidden)
select '11454d7c-aee1-4a09-9e75-566cd01b2e7a', v.title, 'baslik', v.ord, true, false
from (values
  ('Yardımcı Antrenör', 1),
  ('Kaleci Antrenörü', 2),
  ('Atletik Performans Antrenörü', 3),
  ('Analist', 4),
  ('Masör', 5)
) as v(title, ord)
where not exists (
  select 1 from org_nodes
  where parent_id = '11454d7c-aee1-4a09-9e75-566cd01b2e7a' and title = v.title
);

-- 4) "Akademi Direktörü" -> "Akademi Koordinatörü", kök seviyeye çıkar.
update org_nodes set title = 'Akademi Koordinatörü', parent_id = null
  where id = 'ac30f8a5-1af9-4958-b672-706482550eed';

-- 5) U10-U18 yaş grubu düğümleri doğrudan Akademi Koordinatörü'nün altına taşınır ve
--    "... Teknik Ekibi" yerine "... Antrenörü" olarak yeniden adlandırılır.
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U10 Antrenörü' where id = 'cd1672cd-da53-4369-9f09-a0056e820982';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U11 Antrenörü' where id = '1b4e8e6a-36c3-4531-8aac-2b62c69f8fd2';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U12 Antrenörü' where id = '60cb0641-970f-43b9-bb27-eefac1988d25';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U13 Antrenörü' where id = 'dd8a30ad-ad84-406c-a4a6-2195fa47eb36';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U14 Antrenörü' where id = '49b7041c-9fd5-4486-832e-b88ac4b781e6';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U15 Antrenörü' where id = '6e8012a2-3465-47e7-a8d9-fdd76a2728cf';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U16 Antrenörü' where id = 'b20581d3-f4b7-4ed6-91ad-3d19d517684c';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U17 Antrenörü' where id = '0b1b2bde-5b5f-4998-99b9-acc51fa490b6';
update org_nodes set parent_id = 'ac30f8a5-1af9-4958-b672-706482550eed', title = 'U18 Antrenörü' where id = 'b07164c7-dcd5-4e08-9d3a-89a40d0b1385';

-- 6) Artık boş kalan "U10-U18 Antrenörleri" sarmalayıcısı yumuşak silinir (geri yüklenebilir).
update org_nodes set deleted_at = now()
  where id = '9e38f03a-f00d-45c5-ba3c-d1734961a1a9' and deleted_at is null;

-- 7) "Kadın Futbol Takımı" -> "Kadın Futbol Takımı Antrenörü", kök seviyede, çocuksuz.
update org_nodes set title = 'Kadın Futbol Takımı Antrenörü', parent_id = null
  where id = '5b422050-919c-4ca1-a9bd-22fd82e9650a';

-- 8) Doktor/Fizyoterapist/Malzeme Sorumlusu zinciri kaybolmadan Sportif Direktör'ün
--    altına taşınır (Kadın Futbol Takımı'nın artık çocuğu olmasın diye).
update org_nodes set parent_id = '11454d7c-aee1-4a09-9e75-566cd01b2e7a', display_order = 6
  where id = '6c79fabe-a0c6-447d-8254-3d1d20a3ac89';
