import type { CollarType, SleeveType, Fabric } from "./Jersey3D";
import type { Pattern } from "./JerseyDesignCanvas";

export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
}

// Hazır renk kütüphanesi — serbest hex seçimiyle birlikte kullanılır (color input'lar hep açık kalır).
export const COLOR_PALETTES: ColorPalette[] = [
  { name: "Tunaspor Sarı-Siyah", primary: "#FFD700", secondary: "#111111", tertiary: "#FFFFFF" },
  { name: "Klasik Siyah", primary: "#141414", secondary: "#FFFFFF", tertiary: "#8A8A8A" },
  { name: "Beyaz", primary: "#FFFFFF", secondary: "#141414", tertiary: "#B8860B" },
  { name: "Kırmızı", primary: "#C81E2C", secondary: "#FFFFFF", tertiary: "#141414" },
  { name: "Mavi", primary: "#1560BD", secondary: "#FFFFFF", tertiary: "#0B2E52" },
  { name: "Yeşil", primary: "#0F6B3A", secondary: "#FFFFFF", tertiary: "#F2D024" },
  { name: "Mor", primary: "#5B2A86", secondary: "#F2D024", tertiary: "#FFFFFF" },
];

export interface JerseyTemplate {
  name: string;
  pattern: Pattern;
  primary: string;
  secondary: string;
  tertiary: string;
  collarType: CollarType;
  sleeveType: SleeveType;
  fabric: Fabric;
}

// Gerçek bir kulübün kimliğini taklit etmeyen, özgün ilham şablonları — tek
// tıkla forma state'ini doldurur, sonrasında tüm alanlar yine serbestçe
// düzenlenebilir kalır.
export const JERSEY_TEMPLATES: JerseyTemplate[] = [
  { name: "Modern", pattern: "geometrik", primary: "#FFD700", secondary: "#111111", tertiary: "#FFFFFF", collarType: "v_yaka", sleeveType: "kisa", fabric: "parlak" },
  { name: "Minimal", pattern: "duz", primary: "#111111", secondary: "#FFD700", tertiary: "#FFFFFF", collarType: "bisiklet", sleeveType: "kisa", fabric: "mat" },
  { name: "Klasik", pattern: "duz", primary: "#FFD700", secondary: "#111111", tertiary: "#111111", collarType: "polo", sleeveType: "kisa", fabric: "klasik" },
  { name: "Retro", pattern: "parcali", primary: "#B8860B", secondary: "#111111", tertiary: "#FFFFFF", collarType: "polo", sleeveType: "uzun", fabric: "klasik" },
  { name: "Çizgili", pattern: "cizgili", primary: "#FFD700", secondary: "#111111", tertiary: "#FFFFFF", collarType: "bisiklet", sleeveType: "kisa", fabric: "klasik" },
  { name: "Parçalı", pattern: "parcali", primary: "#111111", secondary: "#FFD700", tertiary: "#8A8A8A", collarType: "v_yaka", sleeveType: "kisa", fabric: "mat" },
  { name: "Gradient", pattern: "gradient", primary: "#FFD700", secondary: "#B8860B", tertiary: "#111111", collarType: "v_yaka", sleeveType: "kisa", fabric: "parlak" },
  { name: "Premium", pattern: "geometrik", primary: "#111111", secondary: "#FFD700", tertiary: "#FFFFFF", collarType: "polo", sleeveType: "uzun", fabric: "parlak" },
];
