"use client";

import { useEffect, useRef } from "react";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";
import { getSoundEngine } from "@/lib/sound-engine";

// Sinematik atmosfer sıralayıcısı — gerçek sesin ne zaman/ne seviyede çalacağına
// karar verir, gerçek <audio> oynatımı/karışım/ölçekleme lib/sound-engine.ts'te
// yaşayan tek örnekli motorda yapılır (bu bileşen yeniden monte olsa/kaldırılsa
// bile motor ve sesler etkilenmez — "sayfa değiştirince kesilmesin" kuralı).
export function AmbientSoundscape() {
  const { atmosphere, weatherMode, soundEnabled, volume } = useAtmosphere();
  const engine = getSoundEngine();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const howlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef<"wolf" | "crowd" | null>(null);

  // Yönetici panelinden yüklenen özel ses dosyalarını/ayarlarını bir kez çeker.
  useEffect(() => {
    fetch("/api/sound-assets-public")
      .then((r) => r.json())
      .then((d) => engine.setOverrides(d.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engine.setMasterEnabled(soundEnabled);
  }, [soundEnabled, engine]);

  useEffect(() => {
    engine.setMasterVolume(volume);
  }, [volume, engine]);

  useEffect(() => {
    if (!soundEnabled) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (howlTimerRef.current) clearTimeout(howlTimerRef.current);
    if (swellTimerRef.current) clearTimeout(swellTimerRef.current);
    busyRef.current = null;

    const windBoost = weatherMode === "firtinali" ? 1.5 : weatherMode === "yagmurlu" ? 1.2 : weatherMode === "sisli" || weatherMode === "karli" ? 0.55 : 1;

    // --- Günün saatine göre taban atmosfer ---
    if (atmosphere === "sabah" || atmosphere === "ogle") {
      // ☀️ Gündüz: hafif arka plan + hafif rüzgar, düşük seviyede sürekli loop.
      engine.fadeTo("background", 0.5);
      engine.fadeTo("wind", 0.45 * windBoost);
      engine.fadeTo("stadium-ambience", 0);
      engine.fadeTo("crowd", 0);
    } else if (atmosphere === "aksam") {
      // 🌇 Gün batımı: rüzgar biraz artar, stadyum atmosferi hafifçe başlar (maç havasına geçiş).
      engine.fadeTo("background", 0.25);
      engine.fadeTo("wind", 0.65 * windBoost);
      engine.fadeTo("stadium-ambience", 0.3);
      engine.fadeTo("crowd", 0);
    } else {
      // 🌙 Gece: rüzgar hemen → kurt uluması (5-10 dk'da bir tekrarlar) →
      // +2sn stadyum atmosferi → +3sn düşük seviyede sürekli taraftar sesi,
      // üzerine belirli aralıklarla tribün tezahürat yükselişi biner.
      engine.fadeTo("background", 0);
      engine.fadeTo("wind", 0.5 * windBoost);

      const scheduleHowl = () => {
        const attempt = () => {
          if (busyRef.current === "crowd") {
            howlTimerRef.current = setTimeout(attempt, (5 + Math.random() * 10) * 1000);
            return;
          }
          busyRef.current = "wolf";
          engine.playOneShot("wolf-howl");
          setTimeout(() => { if (busyRef.current === "wolf") busyRef.current = null; }, 6000);
          howlTimerRef.current = setTimeout(attempt, (300 + Math.random() * 300) * 1000); // 5-10 dk
        };
        howlTimerRef.current = setTimeout(attempt, (6 + Math.random() * 10) * 1000);
      };
      scheduleHowl();

      const t1 = setTimeout(() => engine.fadeTo("stadium-ambience", 0.4), 2000);
      const t2 = setTimeout(() => engine.fadeTo("crowd", 0.3), 3000);
      timersRef.current.push(t1, t2);

      const scheduleSwell = () => {
        const attempt = () => {
          if (busyRef.current === "wolf") {
            swellTimerRef.current = setTimeout(attempt, (5 + Math.random() * 10) * 1000);
            return;
          }
          busyRef.current = "crowd";
          engine.fadeTo("crowd", 0.65, 2000);
          setTimeout(() => {
            engine.fadeTo("crowd", 0.3, 2500);
            busyRef.current = null;
          }, 10000 + Math.random() * 10000);
          const silenceMinutes = 8 + Math.random() * 12;
          swellTimerRef.current = setTimeout(attempt, (20 + silenceMinutes * 60) * 1000);
        };
        swellTimerRef.current = setTimeout(attempt, 15000);
      };
      scheduleSwell();
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      if (howlTimerRef.current) clearTimeout(howlTimerRef.current);
      if (swellTimerRef.current) clearTimeout(swellTimerRef.current);
    };
  }, [soundEnabled, atmosphere, weatherMode, engine]);

  return null;
}
