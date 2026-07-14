-- 2026 GÜNCELLEME YAMASI #8 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent (unconditional update).

-- === YAMA X: Harita konumlarını doğrulanmış tam koordinatlarla güncelle ===
update contact_info set
  location_name = 'Tunaspor 1954 Kulüp Binası',
  address = 'Zafer Mahallesi, Egeli Sokak, Eskişehir',
  map_lat = 39.7930,
  map_lng = 30.5288,
  saha_name = 'Ediz Bahtiyaroğlu Sahası',
  saha_address = 'Fevziçakmak Mahallesi, Kanallar Sokak No:31, 26230 Tepebaşı / Eskişehir',
  saha_map_lat = 39.7915,
  saha_map_lng = 30.4908
where id = 1;
