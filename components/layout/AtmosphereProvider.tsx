"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";

export type Atmosphere = "sabah" | "ogle" | "aksam" | "gece";
export type WeatherMode = "acik" | "parcali_bulutlu" | "bulutlu" | "yagmurlu" | "karli" | "sisli" | "firtinali";

interface AtmosphereContextValue {
  atmosphere: Atmosphere;
  weatherMode: WeatherMode;
  specialMoment: boolean; // saat tam 19:54 olduğunda ~5 saniye true
  soundEnabled: boolean;
  toggleSound: () => void;
  volume: number; // 0-1
  setVolume: (v: number) => void;
}

const AtmosphereContext = createContext<AtmosphereContextValue>({
  atmosphere: "gece",
  weatherMode: "acik",
  specialMoment: false,
  soundEnabled: false,
  toggleSound: () => {},
  volume: 0.7,
  setVolume: () => {},
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
  const hasInteracted = useHasInteracted();

  useEffect(() => {
    setSoundEnabled(localStorage.getItem("tuna_atmosphere_sound") === "on");
    const savedVolume = localStorage.getItem("tuna_atmosphere_volume");
    if (savedVolume) setVolumeState(parseFloat(savedVolume));
  }, []);

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("tuna_atmosphere_sound", next ? "on" : "off");
      return next;
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
    () => ({ atmosphere, weatherMode, specialMoment, soundEnabled: effectiveSoundEnabled, toggleSound, volume, setVolume }),
    [atmosphere, weatherMode, specialMoment, effectiveSoundEnabled, volume]
  );

  const [volumePanelOpen, setVolumePanelOpen] = useState(false);

  return (
    <AtmosphereContext.Provider value={value}>
      <div data-atmosphere={atmosphere} className="transition-colors duration-[2500ms]">
        {children}
      </div>
      <div
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2"
        onMouseEnter={() => setVolumePanelOpen(true)}
        onMouseLeave={() => setVolumePanelOpen(false)}
      >
        {volumePanelOpen && (
          <div className="glass-panel px-3 py-2 flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Ses seviyesi"
              className="w-24 accent-tuna-gold"
            />
          </div>
        )}
        <button
          onClick={toggleSound}
          aria-label={soundEnabled ? "Atmosfer sesini kapat" : "Atmosfer sesini aç"}
          title="Atmosfer Sesi"
          className="glass-panel p-3 text-tuna-gold hover:scale-105 transition-transform"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
    </AtmosphereContext.Provider>
  );
}
