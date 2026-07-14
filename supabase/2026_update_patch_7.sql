-- 2026 GÜNCELLEME YAMASI #7 — Tunaspor 1954
-- Supabase SQL Editor'de, önceki yamalardan SONRA çalıştır. İdempotent.

-- === YAMA X: Forma Tasarım Stüdyosu — 3. renk + yazı stilizasyonu ===
alter table jersey_designs add column if not exists tertiary_color text;
alter table jersey_designs add column if not exists text_color text;
alter table jersey_designs add column if not exists text_font text;
alter table jersey_designs add column if not exists text_effect text
  check (text_effect in ('yok', 'kontur', 'golge', 'kabartma'));

-- Desen motoru genişletildi: düz/çizgili/çapraz'a ek olarak parçalı/geometrik/kamuflaj/gradient.
-- Eski check constraint'i (create table içindeki) kaldırılıp genişletilmiş haliyle yeniden eklenir.
alter table jersey_designs drop constraint if exists jersey_designs_pattern_check;
alter table jersey_designs add constraint jersey_designs_pattern_check
  check (pattern in ('duz', 'cizgili', 'capraz', 'parcali', 'geometrik', 'kamuflaj', 'gradient'));
