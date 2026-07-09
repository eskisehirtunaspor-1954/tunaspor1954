"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export function VisitorCounter() {
  const [data, setData] = useState<{ today: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/visitor-count").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-tuna-mist">
      <Users size={14} className="text-tuna-gold" />
      <span>
        Bugün <span className="text-tuna-gold font-semibold tabular-nums">{data.today}</span> ·
        {" "}Toplam <span className="text-tuna-gold font-semibold tabular-nums">{data.total}</span> ziyaretçi
      </span>
    </div>
  );
}
