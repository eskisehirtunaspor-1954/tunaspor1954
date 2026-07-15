-- 2026 GÜNCELLEME YAMASI #18 — Tunaspor 1954
-- "Kulübümüz" menüsünü tamamen yeni bir organizasyon şemasına taşır:
--   Başkanın Mesajı
--   İdari Kadro
--     Başkan
--     Sportif Direktör
--       Antrenörler
--         A Takım (Baş Antrenör, Yardımcı Antrenör, Kaleci Antrenörü,
--                  Atletik Performans Antrenörü, Analiz Antrenörü)
--         Akademi (U Kategorileri) (U10..U18)
--         Kız Takımı (Baş Antrenör, Yardımcı Antrenör, Kaleci Antrenörü,
--                     Atletik Performans Antrenörü)
--       (Doktor > Fizyoterapist > Malzeme Sorumlusu, Masör — kaybolmadan korunur)
--   Tarihçemiz / Misyon & Vizyon / Tesislerimiz
--
-- Hiçbir düğüm kalıcı silinmez; mevcut düğümler yeniden adlandırılıp/taşınıp
-- yeniden kullanılır. Yalnızca bir kez, mevcut canlı ID'lere karşı çalışmak
-- üzere yazıldı ("İdari Kadro" zaten varsa tekrar çalışmaz).

do $$
declare
  v_idari_kadro uuid;
  v_antrenorler uuid;
  v_a_takim uuid;
  v_akademi uuid := 'ac30f8a5-1af9-4958-b672-706482550eed'; -- eski "Akademi Direktörü"/"Akademi Koordinatörü"
  v_kiz_takimi uuid := '5b422050-919c-4ca1-a9bd-22fd82e9650a'; -- eski "Kadın Futbol Takımı Antrenörü"
  v_baskan uuid := '9ca11b23-c8d4-4ee4-9c4c-83c1a73fc844';
  v_sportif uuid := '11454d7c-aee1-4a09-9e75-566cd01b2e7a';
  v_bas_antrenor uuid := 'da1da265-456d-474a-a044-084b29e82949'; -- eski "A Takım Teknik Direktörü"
  v_yardimci uuid;
  v_kaleci uuid;
  v_atletik uuid;
  v_analist uuid;
  v_masor uuid;
  v_doktor uuid := '6c79fabe-a0c6-447d-8254-3d1d20a3ac89';
begin
  if exists (select 1 from org_nodes where title = 'İdari Kadro' and parent_id is null and deleted_at is null) then
    return;
  end if;

  select id into v_yardimci from org_nodes where title = 'Yardımcı Antrenör' and parent_id = v_sportif;
  select id into v_kaleci from org_nodes where title = 'Kaleci Antrenörü' and parent_id = v_sportif;
  select id into v_atletik from org_nodes where title = 'Atletik Performans Antrenörü' and parent_id = v_sportif;
  select id into v_analist from org_nodes where title = 'Analist' and parent_id = v_sportif;
  select id into v_masor from org_nodes where title = 'Masör' and parent_id = v_sportif;

  -- 1) Başkanın Mesajı — /kulubumuz sayfasındaki ilgili bölüme bağlantı.
  insert into org_nodes (parent_id, title, node_type, link_href, display_order, is_active, is_hidden)
  values (null, 'Başkanın Mesajı', 'sayfa_baglantisi', '/kulubumuz#baskan-mesaji', 0, true, false);

  -- 2) İdari Kadro (yeni kök).
  insert into org_nodes (parent_id, title, node_type, display_order, is_active, is_hidden)
  values (null, 'İdari Kadro', 'baslik', 1, true, false)
  returning id into v_idari_kadro;

  -- 3) Başkan ve Sportif Direktör İdari Kadro'nun altına taşınır.
  update org_nodes set parent_id = v_idari_kadro, display_order = 0 where id = v_baskan;
  update org_nodes set parent_id = v_idari_kadro, display_order = 1 where id = v_sportif;

  -- 4) Antrenörler (Sportif Direktör'ün altına, yeni).
  insert into org_nodes (parent_id, title, node_type, display_order, is_active, is_hidden)
  values (v_sportif, 'Antrenörler', 'baslik', 0, true, false)
  returning id into v_antrenorler;

  -- Doktor zinciri Sportif Direktör'ün altında kalır (sırası kaydırılır).
  update org_nodes set display_order = 1 where id = v_doktor;

  -- 5) A Takım (Antrenörler'in altına, yeni).
  insert into org_nodes (parent_id, title, node_type, display_order, is_active, is_hidden)
  values (v_antrenorler, 'A Takım', 'baslik', 0, true, false)
  returning id into v_a_takim;

  -- Mevcut rol düğümleri A Takım'ın altına taşınır, "personel" tipine çevrilir
  -- (staff_id boş — yönetici panelinden gerçek antrenör atanabilsin diye hazır bekler).
  update org_nodes set parent_id = v_a_takim, title = 'Baş Antrenör', node_type = 'personel', display_order = 0 where id = v_bas_antrenor;
  update org_nodes set parent_id = v_a_takim, node_type = 'personel', display_order = 1 where id = v_yardimci;
  update org_nodes set parent_id = v_a_takim, node_type = 'personel', display_order = 2 where id = v_kaleci;
  update org_nodes set parent_id = v_a_takim, node_type = 'personel', display_order = 3 where id = v_atletik;
  update org_nodes set parent_id = v_a_takim, title = 'Analiz Antrenörü', node_type = 'personel', display_order = 4 where id = v_analist;

  -- Masör yeni şemada ayrı listelenmiyor — kaybolmadan Doktor ekibinin yanına taşınır.
  update org_nodes set parent_id = v_doktor, display_order = 0 where id = v_masor;

  -- 6) Akademi (U Kategorileri) — eski "Akademi Koordinatörü" yeniden adlandırılıp taşınır.
  update org_nodes set title = 'Akademi (U Kategorileri)', parent_id = v_antrenorler, display_order = 1 where id = v_akademi;

  update org_nodes set title = 'U10' where parent_id = v_akademi and title = 'U10 Antrenörü';
  update org_nodes set title = 'U11' where parent_id = v_akademi and title = 'U11 Antrenörü';
  update org_nodes set title = 'U12' where parent_id = v_akademi and title = 'U12 Antrenörü';
  update org_nodes set title = 'U13' where parent_id = v_akademi and title = 'U13 Antrenörü';
  update org_nodes set title = 'U14' where parent_id = v_akademi and title = 'U14 Antrenörü';
  update org_nodes set title = 'U15' where parent_id = v_akademi and title = 'U15 Antrenörü';
  update org_nodes set title = 'U16' where parent_id = v_akademi and title = 'U16 Antrenörü';
  update org_nodes set title = 'U17' where parent_id = v_akademi and title = 'U17 Antrenörü';
  update org_nodes set title = 'U18' where parent_id = v_akademi and title = 'U18 Antrenörü';

  -- 7) Kız Takımı — eski "Kadın Futbol Takımı Antrenörü" yeniden adlandırılıp taşınır.
  update org_nodes set title = 'Kız Takımı', parent_id = v_antrenorler, display_order = 2 where id = v_kiz_takimi;

  insert into org_nodes (parent_id, title, node_type, display_order, is_active, is_hidden)
  values
    (v_kiz_takimi, 'Baş Antrenör', 'personel', 0, true, false),
    (v_kiz_takimi, 'Yardımcı Antrenör', 'personel', 1, true, false),
    (v_kiz_takimi, 'Kaleci Antrenörü', 'personel', 2, true, false),
    (v_kiz_takimi, 'Atletik Performans Antrenörü', 'personel', 3, true, false);

  -- 8) Tarihçemiz / Misyon & Vizyon / Tesislerimiz — kök seviyede, /kulubumuz sayfasındaki
  --    ilgili bölümlere bağlantı.
  insert into org_nodes (parent_id, title, node_type, link_href, display_order, is_active, is_hidden)
  values
    (null, 'Tarihçemiz', 'sayfa_baglantisi', '/kulubumuz#tarihce', 2, true, false),
    (null, 'Misyon & Vizyon', 'sayfa_baglantisi', '/kulubumuz#misyon-vizyon', 3, true, false),
    (null, 'Tesislerimiz', 'sayfa_baglantisi', '/kulubumuz#tesisler', 4, true, false);
end $$;
