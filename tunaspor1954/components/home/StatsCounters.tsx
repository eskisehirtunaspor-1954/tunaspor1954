"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, durationMs = 1800, start: boolean) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    let frame: number;
    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [start, target, durationMs]);

  return value;
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

interface StatItem { label: string; value: number; suffix?: string }

export function StatsCounters({ stats }: { stats: StatItem[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} stat={s} start={inView} />
      ))}
    </div>
  );
}

function StatCard({ stat, start }: { stat: StatItem; start: boolean }) {
  const value = useCountUp(stat.value, 1800, start);
  return (
    <div className="glass-panel border border-tuna-gold/20 p-6 text-center hover:border-tuna-gold/50 hover:shadow-goldGlow transition-all">
      <div className="font-display text-4xl text-tuna-gold tabular-nums">
        {value}{stat.suffix}
      </div>
      <div className="text-xs text-tuna-mist mt-2">{stat.label}</div>
    </div>
  );
}
