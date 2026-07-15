"use client";

import { useEffect, useRef, useState } from "react";
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
  const swellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [overridesReady, setOverridesReady] = useState(false);

  // Yönetici panelinden yüklenen özel ses dosyalarını/ayarlarını (dosya, seviye,
  // döngü, aktiflik, otomatik başlatma) bir kez çeker. Aşağıdaki atmosfer/kurt
  // efektleri, yanlış (henüz override'sız) varsayılanla bir an için çalıp hemen
  // durmasın diye bu veri gelene kadar bekler.
  useEffect(() => {
    fetch("/api/sound-assets-public")
      .then((r) => r.json())
      .then((d) => engine.setOverrides(d.data ?? []))
      .catch(() => {})
      .finally(() => setOverridesReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engine.setMasterEnabled(soundEnabled);
  }, [soundEnabled, engine]);

  useEffect(() => {
    engine.setMasterVolume(volume);
  }, [volume, engine]);

  // --- Günün saatine/havasına göre taban atmosfer (sürekli loop katmanları) ---
  useEffect(() => {
    if (!soundEnabled || !overridesReady) return;
    const windBoost = weatherMode === "firtinali" ? 1.5 : weatherMode === "yagmurlu" ? 1.2 : weatherMode === "sisli" || weatherMode === "karli" ? 0.55 : 1;
    const bgOn = engine.autoplayEnabled("background");
    const windOn = engine.autoplayEnabled("wind");
    const stadiumOn = engine.autoplayEnabled("stadium-ambience");

    if (atmosphere === "sabah" || atmosphere === "ogle") {
      engine.fadeTo("background", bgOn ? 0.5 : 0);
      engine.fadeTo("wind", windOn ? 0.45 * windBoost : 0);
      engine.fadeTo("stadium-ambience", 0);
    } else if (atmosphere === "aksam") {
      engine.fadeTo("background", bgOn ? 0.25 : 0);
      engine.fadeTo("wind", windOn ? 0.65 * windBoost : 0);
      engine.fadeTo("stadium-ambience", stadiumOn ? 0.3 : 0);
    } else {
      engine.fadeTo("background", 0);
      engine.fadeTo("wind", windOn ? 0.5 * windBoost : 0);
      engine.fadeTo("stadium-ambience", stadiumOn ? 0.35 : 0);
    }
  }, [soundEnabled, overridesReady, atmosphere, weatherMode, engine]);

  // Sayfa açılır açılmaz (saatten bağımsız) rüzgar + kurt uluması birlikte başlar.
  // Kurt ulumasının GERÇEK dosya süresi bitince (tahmini süre değil, gerçek "ended"
  // olayı — bkz. sound-engine.ts playOneShot onComplete) yalnızca rüzgar düşük
  // seviyede tek başına devam eder; ardından belirli (doğal/rastgele) aralıklarla
  // taraftar tezahüratı devreye girer. Yalnızca bir kez (ses açıldığında) tetiklenir.
  useEffect(() => {
    if (!soundEnabled || !overridesReady) return;

    const startSwellSchedule = () => {
      if (!engine.autoplayEnabled("crowd")) return;
      const scheduleSwell = () => {
        const attempt = () => {
          engine.fadeTo("crowd", 0.6, 2000);
          setTimeout(() => engine.fadeTo("crowd", 0.25, 2500), 10000 + Math.random() * 10000);
          const silenceMinutes = 8 + Math.random() * 12; // 8-20 dakika arası doğal aralık
          swellTimerRef.current = setTimeout(attempt, (20 + silenceMinutes * 60) * 1000);
        };
        swellTimerRef.current = setTimeout(attempt, 5000);
      };
      scheduleSwell();
    };

    const t0 = setTimeout(() => {
      if (engine.autoplayEnabled("wolf-howl")) {
        engine.playOneShot("wolf-howl", 1, startSwellSchedule);
      } else {
        startSwellSchedule();
      }
    }, 300); // rüzgarın bir tık önce işitilmesi için minik bir gecikme
    timersRef.current.push(t0);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (swellTimerRef.current) clearTimeout(swellTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, overridesReady, engine]);

  return null;
}
