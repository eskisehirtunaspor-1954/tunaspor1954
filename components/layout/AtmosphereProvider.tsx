"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Atmosphere = "sabah" | "ogle" | "aksam" | "gece";
export type WeatherMode = "acik" | "parcali_bulutlu" | "bulutlu" | "yagmurlu" | "karli" | "sisli" | "firtinali";

interface AtmosphereContextValue {
  atmosphere: Atmosphere;
  weatherMode: WeatherMode;
  specialMoment: boolean; // saat tam 19:54 olduğunda ~5 saniye true
}

const AtmosphereContext = createContext<AtmosphereContextValue>({
  atmosphere: "gece",
  weatherMode: "acik",
  specialMoment: false,
});

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

  useEffect(() => {
    fetch("/api/site-settings-public")
      .then((r) => r.json())
      .then((d) => {
        if (d?.atmosphere_mode) setAtmosphereOverride(d.atmosphere_mode);
        if (d?.weather_mode) setWeatherOverride(d.weather_mode);
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

  // Value nesnesi memoize edilmezse her render'da yeni bir referans oluşur ve
  // bu context'i dinleyen TÜM bileşenler (StadiumBackground, WeatherEffects,
  // Hero, LightningSystem, AmbientSoundscape...) gereksiz yere yeniden render olur.
  const value = useMemo(
    () => ({ atmosphere, weatherMode, specialMoment }),
    [atmosphere, weatherMode, specialMoment]
  );

  return (
    <AtmosphereContext.Provider value={value}>
      <div data-atmosphere={atmosphere} className="transition-colors duration-[2500ms]">
        {children}
      </div>
    </AtmosphereContext.Provider>
  );
}
