-- 2026 GÜNCELLEME YAMASI #4 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA M: Videolar modülü — YouTube ID yerine doğrudan video dosyası yükleme ===
-- youtube_id kolonu KALDIRILMIYOR (geriye dönük uyumluluk — eski kayıtlar hâlâ
-- YouTube embed ile gösterilir); yeni/düzenlenen videolarda admin panel artık
-- yalnızca video_url (Supabase Storage'a yüklenen dosya) alanını kullanıyor.
alter table videos add column if not exists video_url text;
alter table videos alter column youtube_id drop not null;
