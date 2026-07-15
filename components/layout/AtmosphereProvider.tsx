"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { getSoundEngine, type SoundCategory } from "@/lib/sound-engine";

export type Atmosphere = "sabah" | "ogle" | "aksam" | "gece";
export type WeatherMode = "acik" | "parcali_bulutlu" | "bulutlu" | "yagmurlu" | "karli" | "sisli" | "firtinali";

const CATEGORY_LABEL: Record<SoundCategory, string> = {
  atmosfer: "Atmosfer",
  tribun: "Tribün",
  kurt: "Kurt",
  efekt: "Efektler",
};

interface AtmosphereContextValue {
  atmosphere: Atmosphere;
  weatherMode: WeatherMode;
  specialMoment: boolean; // saat tam 19:54 olduğunda ~5 saniye true
  soundEnabled: boolean;
  toggleSound: () => void;
  volume: number; // 0-1
  setVolume: (v: number) => void;
  categoryVolumes: Record<SoundCategory, number>;
  categoryEnabled: Record<SoundCategory, boolean>;
  setCategoryVolume: (cat: SoundCategory, v: number) => void;
  toggleCategory: (cat: SoundCategory) => void;
}

const DEFAULT_CATEGORY_VOLUMES: Record<SoundCategory, number> = { atmosfer: 1, tribun: 1, kurt: 1, efekt: 1 };
const DEFAULT_CATEGORY_ENABLED: Record<SoundCategory, boolean> = { atmosfer: true, tribun: true, kurt: true, efekt: true };

const AtmosphereContext = createContext<AtmosphereContextValue>({
  atmosphere: "gece",
  weatherMode: "acik",
  specialMoment: false,
  soundEnabled: false,
  toggleSound: () => {},
  volume: 0.7,
  setVolume: () => {},
  categoryVolumes: DEFAULT_CATEGORY_VOLUMES,
  categoryEnabled: DEFAULT_CATEGORY_ENABLED,
  setCategoryVolume: () => {},
  toggleCategory: () => {},
});

// Ses hiçbir zaman sayfa yüklenir yüklenmez başlamamalı — yalnızca kullanıcının
// ilk gerçek etkileşiminden (tık/tuş/dokunuş) sonra "kilidi açılır". Bu hem
// spesifikasyonun istediği davranış hem de tarayıcıların autoplay policy'si
// yüzünden zaten kullanıcı jesti olmadan sessiz kalan AudioContext'lerin
// gereksiz yere oluşturulmasını önler.
function useHasInteracted(): boolean {
  const [hasInteracted, setHasInteracted] = useState(false);
  useEffect(() => {
    if (hasInteracted) return;
    const unlock = () => setHasInteracted(true);
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, unlock, { once: true, passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, unlock));
  }, [hasInteracted]);
  return hasInteracted;
}

export const useAtmosphere = () => useContext(AtmosphereContext);

// Dört farklı zaman dilimi — her biri kendine özgü ses/görsel karaktere sahip:
// Sabah: kuş sesleri, hafif sis, antrenman atmosferi
// Öğle: parlak, canlı, enerjik gündüz
// Akşam: gün batımı, projektörler yanmaya başlıyor, maç hazırlığı
// Gece: stadyum ışıkları, hafif duman, taraftar tezahüratı, ışık huzmeleri
function computeAtmosphere(hour: number): Atmosphere {
  if (hour >= 6 && hour < 11) return "sabah";
  if (hour >= 11 && hour < 17) return "ogle";
  if (hour >= 17 && hour < 20) return "aksam";
  return "gece";
}

// OpenWeather'ın İngilizce "main" alanına ve bulut kapsama yüzdesine göre
// hava durumu efekt modunu türetir.
function mapConditionToWeatherMode(conditionCode?: string, cloudiness?: number): WeatherMode {
  const c = (conditionCode ?? "").toLowerCase();
  if (c.includes("thunderstorm")) return "firtinali";
  if (c.includes("snow")) return "karli";
  if (c.includes("rain") || c.includes("drizzle")) return "yagmurlu";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "sisli";
  if (c.includes("cloud")) {
    return (cloudiness ?? 100) < 40 ? "parcali_bulutlu" : "bulutlu";
  }
  return "acik";
}

// Bu provider iki katmanı birleştirir:
// 1) Gerçek saate göre otomatik hesaplanan sabah/öğle/akşam/gece durumu (arka plan görseli + atmosfer karakteri)
// 2) Gerçek Eskişehir hava durumuna göre otomatik hesaplanan efekt modu (yağmur/kar/sis/fırtına)
// Admin panelinden (Site Ayarları) her ikisi de "otomatik" yerine sabit bir değere override edilebilir.
export function AtmosphereProvider({ children }: { children: ReactNode }) {
  const [autoAtmosphere, setAutoAtmosphere] = useState<Atmosphere>(() =>
    computeAtmosphere(new Date().getHours())
  );
  const [atmosphereOverride, setAtmosphereOverride] = useState<Atmosphere | "otomatik">("otomatik");
  const [weatherOverride, setWeatherOverride] = useState<WeatherMode | "otomatik">("otomatik");
  const [autoWeather, setAutoWeather] = useState<WeatherMode>("acik");
  const [specialMoment, setSpecialMoment] = useState(false);
  // Site genelinde TEK bir atmosfer sesi kontrolü (kuş/rüzgar/kalabalık/yağmur hepsi
  // bu tek anahtara bağlı) — kullanıcının tercihi sayfalar arası gezinirken korunsun
  // diye localStorage'a yazılır.
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [siteSoundEnabled, setSiteSoundEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.7);
  const [categoryVolumes, setCategoryVolumes] = useState<Record<SoundCategory, number>>(DEFAULT_CATEGORY_VOLUMES);
  const [categoryEnabled, setCategoryEnabled] = useState<Record<SoundCategory, boolean>>(DEFAULT_CATEGORY_ENABLED);
  const hasInteracted = useHasInteracted();

  useEffect(() => {
    // Varsayılan olarak ses AÇIK kabul edilir ("site açılır açılmaz otomatik
    // başlasın") — kullanıcı daha önce açıkça kapatmadıysa (localStorage'da
    // "off" yoksa) sesi otomatik denenir. Tarayıcı otomatik oynatmayı
    // engellerse (neredeyse her zaman engeller) ilk kullanıcı etkileşiminde
    // (useHasInteracted) devreye girer — bkz. effectiveSoundEnabled.
    setSoundEnabled(localStorage.getItem("tuna_atmosphere_sound") !== "off");
    const savedVolume = localStorage.getItem("tuna_atmosphere_volume");
    if (savedVolume) setVolumeState(parseFloat(savedVolume));

    const engine = getSoundEngine();
    (Object.keys(DEFAULT_CATEGORY_VOLUMES) as SoundCategory[]).forEach((cat) => {
      const savedCatVolume = localStorage.getItem(`tuna_sound_${cat}_volume`);
      const savedCatEnabled = localStorage.getItem(`tuna_sound_${cat}_enabled`);
      const v = savedCatVolume ? parseFloat(savedCatVolume) : 1;
      const enabled = savedCatEnabled !== "off";
      setCategoryVolumes((prev) => ({ ...prev, [cat]: v }));
      setCategoryEnabled((prev) => ({ ...prev, [cat]: enabled }));
      engine.setCategoryVolume(cat, v);
      engine.setCategoryEnabled(cat, enabled);
    });
  }, []);

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("tuna_atmosphere_sound", next ? "on" : "off");
      return next;
    });
  }

  function setCategoryVolume(cat: SoundCategory, v: number) {
    setCategoryVolumes((prev) => ({ ...prev, [cat]: v }));
    localStorage.setItem(`tuna_sound_${cat}_volume`, String(v));
    getSoundEngine().setCategoryVolume(cat, v);
  }

  function toggleCategory(cat: SoundCategory) {
    setCategoryEnabled((prev) => {
      const next = !prev[cat];
      localStorage.setItem(`tuna_sound_${cat}_enabled`, next ? "on" : "off");
      getSoundEngine().setCategoryEnabled(cat, next);
      return { ...prev, [cat]: next };
    });
  }

  function setVolume(v: number) {
    setVolumeState(v);
    localStorage.setItem("tuna_atmosphere_volume", String(v));
  }

  useEffect(() => {
    fetch("/api/site-settings-public")
      .then((r) => r.json())
      .then((d) => {
        if (d?.atmosphere_mode) setAtmosphereOverride(d.atmosphere_mode);
        if (d?.weather_mode) setWeatherOverride(d.weather_mode);
        if (typeof d?.ambient_sound_enabled === "boolean") setSiteSoundEnabled(d.ambient_sound_enabled);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function fetchWeather() {
      fetch("/api/weather")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.conditionCode) setAutoWeather(mapConditionToWeatherMode(d.conditionCode, d.cloudiness)); })
        .catch(() => {});
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setAutoAtmosphere(computeAtmosphere(now.getHours()));
      setSpecialMoment(now.getHours() === 19 && now.getMinutes() === 54 && now.getSeconds() < 5);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const atmosphere = atmosphereOverride === "otomatik" ? autoAtmosphere : atmosphereOverride;
  const weatherMode = weatherOverride === "otomatik" ? autoWeather : weatherOverride;

  // Ses üç kapıdan birden geçmeli: kullanıcı kendi tercihiyle açmış olmalı, en az
  // bir kez sayfayla etkileşime girmiş olmalı (autoplay yok) ve Süper Admin site
  // genelinde ortam seslerini kapatmamış olmalı.
  const effectiveSoundEnabled = soundEnabled && hasInteracted && siteSoundEnabled;

  // Value nesnesi memoize edilmezse her render'da yeni bir referans oluşur ve
  // bu context'i dinleyen TÜM bileşenler (StadiumBackground, WeatherEffects,
  // Hero, LightningSystem, AmbientSoundscape...) gereksiz yere yeniden render olur.
  const value = useMemo(
    () => ({
      atmosphere, weatherMode, specialMoment, soundEnabled: effectiveSoundEnabled, toggleSound, volume, setVolume,
      categoryVolumes, categoryEnabled, setCategoryVolume, toggleCategory,
    }),
    [atmosphere, weatherMode, specialMoment, effectiveSoundEnabled, volume, categoryVolumes, categoryEnabled]
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Panel yalnızca hoparlör ikonuna tıklanınca açılır/kapanır (artık hover
  // değil). Boş bir yere tıklamak veya ESC panel kapatır; panel/slider'ların
  // kendi üzerine tıklamak kapatmaz (ref.contains kontrolü sayesinde).
  useEffect(() => {
    if (!panelOpen) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setPanelOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [panelOpen]);

  return (
    <AtmosphereContext.Provider value={value}>
      <div data-atmosphere={atmosphere} className="transition-colors duration-[2500ms]">
        {children}
      </div>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="sound-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-5 z-40 flex items-center gap-2">
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              ref={panelRef}
              key="sound-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="glass-panel px-4 py-3 flex flex-col gap-2 w-56 max-w-[90vw] origin-bottom-right"
            >
              <label className="flex items-center gap-2 text-xs text-tuna-mist">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`w-16 shrink-0 text-left ${soundEnabled ? "text-tuna-gold" : "text-tuna-mist/50 line-through"}`}
                >
                  Tüm Sesler
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Ana ses seviyesi"
                  className="flex-1 accent-tuna-gold"
                />
              </label>
              {(Object.keys(CATEGORY_LABEL) as SoundCategory[]).map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-xs text-tuna-mist">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`w-16 shrink-0 text-left ${categoryEnabled[cat] ? "text-tuna-gold" : "text-tuna-mist/50 line-through"}`}
                  >
                    {CATEGORY_LABEL[cat]}
                  </button>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={categoryVolumes[cat]}
                    onChange={(e) => setCategoryVolume(cat, parseFloat(e.target.value))}
                    disabled={!categoryEnabled[cat]}
                    aria-label={`${CATEGORY_LABEL[cat]} ses seviyesi`}
                    className="flex-1 accent-tuna-gold disabled:opacity-40"
                  />
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          ref={buttonRef}
          onClick={() => setPanelOpen((v) => !v)}
          aria-label={panelOpen ? "Ses panelini kapat" : "Ses panelini aç"}
          aria-expanded={panelOpen}
          title="Ses Ayarları"
          className="glass-panel p-3 text-tuna-gold hover:scale-105 transition-transform"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
    </AtmosphereContext.Provider>
  );
}
