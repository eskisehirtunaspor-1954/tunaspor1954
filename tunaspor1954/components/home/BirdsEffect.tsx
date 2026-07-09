"use client";

import { useEffect, useState } from "react";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";

// Hava açık/güneşliyken (gece hariç) hero'da uçuşan birkaç kuş silüeti — CSS
// keyframe animasyonuyla soldan sağa, hafif yukarı-aşağı süzülerek geçer.
// Performans notu: sadece birkaç adet basit SVG + CSS transform, canvas/WebGL yok.
export function BirdsEffect() {
  const { atmosphere } = useAtmosphere();
  const [isClear, setIsClear] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsClear(data?.conditionCode === "Clear"))
      .catch(() => setIsClear(false));
  }, []);

  if (!isClear || atmosphere === "gece") return null;

  const birds = [
    { top: "12%", duration: 26, delay: 0, scale: 1 },
    { top: "20%", duration: 34, delay: 4, scale: 0.75 },
    { top: "8%", duration: 30, delay: 9, scale: 0.6 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {birds.map((b, i) => (
        <div
          key={i}
          className="absolute animate-birdFly motion-reduce:hidden"
          style={{
            top: b.top,
            left: "-5%",
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            transform: `scale(${b.scale})`,
          }}
        >
          <BirdSilhouette />
        </div>
      ))}

      <style jsx>{`
        @keyframes birdFly {
          0% { transform: translate(0, 0) scale(var(--s, 1)); }
          50% { transform: translate(60vw, -18px) scale(var(--s, 1)); }
          100% { transform: translate(120vw, 6px) scale(var(--s, 1)); }
        }
        .animate-birdFly {
          animation-name: birdFly;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

function BirdSilhouette() {
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" className="animate-wingFlap">
      <path
        d="M0 7 Q7 0 14 7 Q21 0 28 7"
        fill="none"
        stroke="rgba(20,20,20,0.55)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <style jsx>{`
        @keyframes wingFlap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
        .animate-wingFlap {
          animation: wingFlap 0.6s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </svg>
  );
}
