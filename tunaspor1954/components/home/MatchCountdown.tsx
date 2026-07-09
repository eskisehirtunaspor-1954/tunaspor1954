"use client";

import { useEffect, useState } from "react";

function getRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export function MatchCountdown({ matchDate }: { matchDate: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(matchDate));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(matchDate)), 1000);
    return () => clearInterval(interval);
  }, [matchDate]);

  if (!remaining) {
    return <p className="text-tuna-gold text-sm font-semibold animate-breathe">Maç zamanı geldi! ⚽</p>;
  }

  const units = [
    { label: "Gün", value: remaining.days },
    { label: "Saat", value: remaining.hours },
    { label: "Dk", value: remaining.minutes },
    { label: "Sn", value: remaining.seconds },
  ];

  return (
    <div className="flex gap-2 justify-center lg:justify-start">
      {units.map((u) => (
        <div key={u.label} className="text-center bg-white/5 border border-tuna-gold/20 rounded-lg px-2.5 py-1.5 min-w-[48px]">
          <div className="font-display text-lg text-tuna-gold tabular-nums leading-none">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] text-tuna-mist mt-0.5">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
