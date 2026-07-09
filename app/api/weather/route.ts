import { NextResponse } from "next/server";

// Eskişehir merkez koordinatları — sabit, çünkü kulüp sahası şehir merkezinde.
const LAT = 39.7767;
const LON = 30.5206;

export async function GET() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return NextResponse.json({ error: "Hava durumu servisi yapılandırılmadı." }, { status: 503 });

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&lang=tr&appid=${key}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("Hava durumu alınamadı");
    const data = await res.json();

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0]?.description,
      conditionCode: data.weather[0]?.main, // Clear, Clouds, Rain, Thunderstorm, Mist...
      icon: data.weather[0]?.icon,
      humidity: data.main.humidity,
      wind: data.wind.speed,
      cloudiness: data.clouds?.all ?? 0,
      sunrise: data.sys.sunrise * 1000, // ms epoch
      sunset: data.sys.sunset * 1000,
    });
  } catch {
    return NextResponse.json({ error: "Hava durumu şu anda alınamıyor." }, { status: 502 });
  }
}
