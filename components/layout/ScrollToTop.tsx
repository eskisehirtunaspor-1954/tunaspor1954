"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Sayfa başına dön"
      className="fixed bottom-5 left-5 z-40 bg-white/5 border border-tuna-gold/30 text-tuna-gold rounded-full p-3 backdrop-blur-glass hover:bg-tuna-gold hover:text-tuna-black transition-colors animate-fadeUp"
    >
      <ArrowUp size={18} />
    </button>
  );
}
