"use client";

import { useEffect, useState } from "react";
import { MapPin, Cloud, Thermometer, Wind, Droplets, Sunrise, Sunset, Moon, Sun } from "lucide-react";

interface WeatherData {
  temp: number; feelsLike: number; condition: string; humidity: number;
  wind: number; sunrise: number; sunset: number;
}

export function EskisehirInfoPanel() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/weather").then((r) => (r.ok ? r.json() : null)).then(setWeather).catch(() => {});
  }, []);

  if (!now) return null;

  const isDaytime = weather ? now.getTime() > weather.sunrise && now.getTime() < weather.sunset : now.getHours() >= 7 && now.getHours() < 19;

  return (
    <div className="glass-panel border border-tuna-gold/25 p-5 w-full max-w-sm">
      <div className="flex items-center gap-2 mb-4 text-tuna-gold">
        <MapPin size={16} />
        <span className="text-sm font-semibold tracking-wide">ESKİŞEHİR, TÜRKİYE</span>
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <span className="font-display text-4xl tabular-nums">
          {now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        {isDaytime ? <Sun className="text-tuna-gold" size={22} /> : <Moon className="text-tuna-gold" size={22} />}
      </div>
      <p className="text-xs text-tuna-mist mb-4">
        {now.toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      </p>

      {weather ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-tuna-gold shrink-0" />
            <span className="capitalize truncate">{weather.condition}</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-tuna-gold shrink-0" />
            <span>{weather.temp}°C (hissedilen {weather.feelsLike}°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-tuna-gold shrink-0" />
            <span>{weather.wind} m/s</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-tuna-gold shrink-0" />
            <span>%{weather.humidity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sunrise size={16} className="text-tuna-gold shrink-0" />
            <span>{new Date(weather.sunrise).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sunset size={16} className="text-tuna-gold shrink-0" />
            <span>{new Date(weather.sunset).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-tuna-mist">Hava durumu yükleniyor...</p>
      )}
    </div>
  );
}
