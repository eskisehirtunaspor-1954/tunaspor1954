"use client";

import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setWeather)
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!weather) return <div className="glass-panel p-4 text-sm text-tuna-mist animate-pulse">Hava durumu yükleniyor...</div>;

  return (
    <div className="glass-panel p-4 flex items-center gap-4 text-sm">
      <Cloud className="text-tuna-yellow" size={28} />
      <div>
        <div className="font-display text-2xl">{weather.temp}°C</div>
        <div className="text-tuna-mist capitalize">{weather.condition}</div>
      </div>
      <div className="ml-auto flex flex-col gap-1 text-tuna-mist text-xs">
        <span className="flex items-center gap-1"><Droplets size={14} /> %{weather.humidity}</span>
        <span className="flex items-center gap-1"><Wind size={14} /> {weather.wind} m/s</span>
      </div>
    </div>
  );
}
