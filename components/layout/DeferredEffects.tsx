"use client";

import dynamic from "next/dynamic";

// Bu bileşenler ilk ekranın (LCP/FCP) bir parçası değil — hava durumu efektleri
// ve sohbet balonu kullanıcı sayfayı görsel olarak görüp etkileşime geçmeden
// önce JS'in main thread'ini meşgul etmesin diye ayrı chunk'lara bölünüyor ve
// `ssr:false` ile yalnızca client'ta, ilk boyamadan sonra yükleniyor.
// (`ssr:false`, "use client" içeren bir dosyada olmak zorunda — bu yüzden bu
// küçük sarmalayıcı dosya var; doğrudan layout.tsx bir server component.)
const WeatherEffects = dynamic(
  () => import("@/components/home/WeatherEffects").then((m) => m.WeatherEffects),
  { ssr: false }
);
const GoldenWolfBubble = dynamic(
  () => import("@/components/home/GoldenWolfBubble").then((m) => m.GoldenWolfBubble),
  { ssr: false }
);
// Atmosfer sesi (rüzgar/kuş/kurt uluması/taraftar) site genelinde çalar — ses
// aç/kapa düğmesi zaten her sayfada görünür olduğundan (bkz. AtmosphereProvider),
// sesin yalnızca ana sayfada duyulması tutarsız bir deneyim olurdu.
const AmbientSoundscape = dynamic(
  () => import("@/components/home/AmbientSoundscape").then((m) => m.AmbientSoundscape),
  { ssr: false }
);

export function DeferredEffects() {
  return (
    <>
      <WeatherEffects />
      <AmbientSoundscape />
      <GoldenWolfBubble />
    </>
  );
}
