"use client";

import { useState } from "react";
import Image from "next/image";

// Kurt maskotu — nefes alma animasyonu (yavaş scale) + hover'da altın glow.
// public/images/mascot.png henüz eklenmediyse sessizce gizlenir, navbar'ı bozmaz.
export function Mascot() {
  const [error, setError] = useState(false);
  if (error) return null;

  return (
    <div className="hidden sm:block animate-breathe motion-reduce:animate-none hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.7)] transition-[filter] duration-300">
      <Image
        src="/images/mascot.png"
        alt="Tunaspor 1954 Maskotu"
        width={44}
        height={44}
        className="h-11 w-auto object-contain hover:scale-110 transition-transform duration-300"
        onError={() => setError(true)}
      />
    </div>
  );
}
