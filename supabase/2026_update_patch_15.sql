-- 2026 GÜNCELLEME YAMASI #15 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent DEĞİLDİR
-- (yalnızca org_nodes tablosu tamamen boşsa çalıştırılmalı) — bu yüzden en başta
-- bir kontrol vardır: kök seviyede zaten "Başkan" başlığı varsa hiçbir şey eklemez.

-- === YAMA: Kulübümüz organizasyon ağacı için başlangıç (seed) verisi ===
-- Başkan → Sportif Direktör → A Takım Antrenörleri → Akademi Direktörü →
-- U10-U18 Antrenörleri (yaş gruplarına ayrılmış) → Kadın Futbol Takımı →
-- Doktor → Fizyoterapist → Malzeme Sorumlusu zinciri. Bu yalnızca BAŞLIK
-- iskeleti oluşturur — her başlığın altına gerçek personel, admin panelinden
-- ("Kulübümüz — Organizasyon") "Alt Öğe Ekle" ile kolayca eklenebilir.
do $$
declare
  v_baskan uuid;
  v_sportif uuid;
  v_a_takim uuid;
  v_akademi uuid;
  v_u10_18 uuid;
  v_kadin uuid;
  v_doktor uuid;
  v_fizyo uuid;
begin
  if exists (select 1 from org_nodes where parent_id is null and title = 'Başkan' and deleted_at is null) then
    return;
  end if;

  insert into org_nodes (title, node_type, display_order) values ('Başkan', 'baslik', 0) returning id into v_baskan;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_baskan, 'Sportif Direktör', 'baslik', 0) returning id into v_sportif;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_sportif, 'A Takım Antrenörleri', 'baslik', 0) returning id into v_a_takim;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_a_takim, 'Akademi Direktörü', 'baslik', 0) returning id into v_akademi;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_akademi, 'U10-U18 Antrenörleri', 'baslik', 0) returning id into v_u10_18;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_u10_18, 'Kadın Futbol Takımı', 'baslik', 0) returning id into v_kadin;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_kadin, 'Doktor', 'baslik', 0) returning id into v_doktor;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_doktor, 'Fizyoterapist', 'baslik', 0) returning id into v_fizyo;
  insert into org_nodes (parent_id, title, node_type, display_order) values (v_fizyo, 'Malzeme Sorumlusu', 'baslik', 0);

  -- U10-U18 Antrenörleri başlığının altına her yaş grubu ayrı bir alt başlık olarak eklenir.
  insert into org_nodes (parent_id, title, node_type, display_order)
  select v_u10_18, u.label, 'baslik', u.ord
  from (values
    ('U10 Teknik Ekibi', 0), ('U11 Teknik Ekibi', 1), ('U12 Teknik Ekibi', 2),
    ('U13 Teknik Ekibi', 3), ('U14 Teknik Ekibi', 4), ('U15 Teknik Ekibi', 5),
    ('U16 Teknik Ekibi', 6), ('U17 Teknik Ekibi', 7), ('U18 Teknik Ekibi', 8)
  ) as u(label, ord);
end $$;
