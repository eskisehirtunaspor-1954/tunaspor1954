// Ülke kodu (ISO 3166-1 alpha-2) -> isim, bayrak emoji, yaklaşık merkez enlem/boylam.
// Harita üzerinde nokta konumlandırmak için kullanılır. Kapsam: dünya genelinde en
// sık görülmesi beklenen ~90 ülke (Avrupa, Türkiye çevresi, Amerika, Asya, Afrika, Okyanusya).
// Listede olmayan bir kod gelirse harita listede "Diğer" olarak gösterilir, hata vermez.

export interface CountryInfo {
  name: string;
  flag: string;
  lat: number;
  lng: number;
}

export const COUNTRIES: Record<string, CountryInfo> = {
  TR: { name: "Türkiye", flag: "🇹🇷", lat: 38.9, lng: 35.2 },
  DE: { name: "Almanya", flag: "🇩🇪", lat: 51.2, lng: 10.4 },
  NL: { name: "Hollanda", flag: "🇳🇱", lat: 52.1, lng: 5.3 },
  FR: { name: "Fransa", flag: "🇫🇷", lat: 46.6, lng: 2.2 },
  BE: { name: "Belçika", flag: "🇧🇪", lat: 50.5, lng: 4.5 },
  AT: { name: "Avusturya", flag: "🇦🇹", lat: 47.5, lng: 14.6 },
  CH: { name: "İsviçre", flag: "🇨🇭", lat: 46.8, lng: 8.2 },
  GB: { name: "Birleşik Krallık", flag: "🇬🇧", lat: 54.0, lng: -2.0 },
  IE: { name: "İrlanda", flag: "🇮🇪", lat: 53.4, lng: -8.0 },
  SE: { name: "İsveç", flag: "🇸🇪", lat: 62.0, lng: 15.0 },
  NO: { name: "Norveç", flag: "🇳🇴", lat: 60.5, lng: 8.5 },
  DK: { name: "Danimarka", flag: "🇩🇰", lat: 56.0, lng: 10.0 },
  FI: { name: "Finlandiya", flag: "🇫🇮", lat: 64.9, lng: 26.0 },
  PL: { name: "Polonya", flag: "🇵🇱", lat: 52.1, lng: 19.4 },
  IT: { name: "İtalya", flag: "🇮🇹", lat: 42.8, lng: 12.8 },
  ES: { name: "İspanya", flag: "🇪🇸", lat: 40.2, lng: -3.7 },
  PT: { name: "Portekiz", flag: "🇵🇹", lat: 39.4, lng: -8.2 },
  GR: { name: "Yunanistan", flag: "🇬🇷", lat: 39.0, lng: 22.0 },
  BG: { name: "Bulgaristan", flag: "🇧🇬", lat: 42.7, lng: 25.5 },
  RO: { name: "Romanya", flag: "🇷🇴", lat: 45.9, lng: 25.0 },
  HU: { name: "Macaristan", flag: "🇭🇺", lat: 47.2, lng: 19.5 },
  CZ: { name: "Çekya", flag: "🇨🇿", lat: 49.8, lng: 15.5 },
  SK: { name: "Slovakya", flag: "🇸🇰", lat: 48.7, lng: 19.5 },
  HR: { name: "Hırvatistan", flag: "🇭🇷", lat: 45.1, lng: 15.2 },
  RS: { name: "Sırbistan", flag: "🇷🇸", lat: 44.0, lng: 21.0 },
  UA: { name: "Ukrayna", flag: "🇺🇦", lat: 48.4, lng: 31.2 },
  RU: { name: "Rusya", flag: "🇷🇺", lat: 61.5, lng: 90.0 },
  AZ: { name: "Azerbaycan", flag: "🇦🇿", lat: 40.1, lng: 47.6 },
  GE: { name: "Gürcistan", flag: "🇬🇪", lat: 42.3, lng: 43.4 },
  AM: { name: "Ermenistan", flag: "🇦🇲", lat: 40.1, lng: 45.0 },
  CY: { name: "Kıbrıs", flag: "🇨🇾", lat: 35.1, lng: 33.4 },
  IL: { name: "İsrail", flag: "🇮🇱", lat: 31.0, lng: 34.8 },
  SA: { name: "Suudi Arabistan", flag: "🇸🇦", lat: 24.0, lng: 45.0 },
  AE: { name: "BAE", flag: "🇦🇪", lat: 24.0, lng: 54.0 },
  QA: { name: "Katar", flag: "🇶🇦", lat: 25.3, lng: 51.2 },
  IQ: { name: "Irak", flag: "🇮🇶", lat: 33.2, lng: 43.7 },
  IR: { name: "İran", flag: "🇮🇷", lat: 32.4, lng: 53.7 },
  EG: { name: "Mısır", flag: "🇪🇬", lat: 26.8, lng: 30.8 },
  MA: { name: "Fas", flag: "🇲🇦", lat: 31.8, lng: -7.1 },
  TN: { name: "Tunus", flag: "🇹🇳", lat: 33.9, lng: 9.5 },
  DZ: { name: "Cezayir", flag: "🇩🇿", lat: 28.0, lng: 2.6 },
  ZA: { name: "Güney Afrika", flag: "🇿🇦", lat: -30.6, lng: 22.9 },
  NG: { name: "Nijerya", flag: "🇳🇬", lat: 9.1, lng: 8.7 },
  US: { name: "ABD", flag: "🇺🇸", lat: 39.8, lng: -98.5 },
  CA: { name: "Kanada", flag: "🇨🇦", lat: 56.1, lng: -106.3 },
  MX: { name: "Meksika", flag: "🇲🇽", lat: 23.6, lng: -102.5 },
  BR: { name: "Brezilya", flag: "🇧🇷", lat: -14.2, lng: -51.9 },
  AR: { name: "Arjantin", flag: "🇦🇷", lat: -38.4, lng: -63.6 },
  CO: { name: "Kolombiya", flag: "🇨🇴", lat: 4.6, lng: -74.3 },
  CN: { name: "Çin", flag: "🇨🇳", lat: 35.9, lng: 104.2 },
  JP: { name: "Japonya", flag: "🇯🇵", lat: 36.2, lng: 138.3 },
  KR: { name: "Güney Kore", flag: "🇰🇷", lat: 35.9, lng: 127.8 },
  IN: { name: "Hindistan", flag: "🇮🇳", lat: 20.6, lng: 79.0 },
  PK: { name: "Pakistan", flag: "🇵🇰", lat: 30.4, lng: 69.3 },
  ID: { name: "Endonezya", flag: "🇮🇩", lat: -0.8, lng: 113.9 },
  MY: { name: "Malezya", flag: "🇲🇾", lat: 4.2, lng: 101.9 },
  TH: { name: "Tayland", flag: "🇹🇭", lat: 15.9, lng: 100.9 },
  VN: { name: "Vietnam", flag: "🇻🇳", lat: 14.1, lng: 108.3 },
  AU: { name: "Avustralya", flag: "🇦🇺", lat: -25.3, lng: 133.8 },
  NZ: { name: "Yeni Zelanda", flag: "🇳🇿", lat: -41.0, lng: 174.9 },
  KZ: { name: "Kazakistan", flag: "🇰🇿", lat: 48.0, lng: 66.9 },
  TM: { name: "Türkmenistan", flag: "🇹🇲", lat: 38.9, lng: 59.6 },
  UZ: { name: "Özbekistan", flag: "🇺🇿", lat: 41.4, lng: 64.6 },
  AL: { name: "Arnavutluk", flag: "🇦🇱", lat: 41.2, lng: 20.2 },
  MK: { name: "Kuzey Makedonya", flag: "🇲🇰", lat: 41.6, lng: 21.7 },
  BA: { name: "Bosna Hersek", flag: "🇧🇦", lat: 43.9, lng: 17.7 },
  XK: { name: "Kosova", flag: "🇽🇰", lat: 42.6, lng: 20.9 },
  LT: { name: "Litvanya", flag: "🇱🇹", lat: 55.2, lng: 23.9 },
  LV: { name: "Letonya", flag: "🇱🇻", lat: 56.9, lng: 24.6 },
  EE: { name: "Estonya", flag: "🇪🇪", lat: 58.6, lng: 25.0 },
};

export function equirectangularPosition(lat: number, lng: number): { xPct: number; yPct: number } {
  const xPct = ((lng + 180) / 360) * 100;
  const yPct = ((90 - lat) / 180) * 100;
  return { xPct, yPct };
}
