"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

export default function Page() {
  const [playerOptions, setPlayerOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/players")
      .then((r) => r.json())
      .then((d) => setPlayerOptions((d.data ?? []).map((p: any) => ({ value: p.id, label: p.full_name }))));
  }, []);

  const fields: FieldDef[] = [
    { name: "player_id", label: "Oyuncu", type: "select", options: playerOptions, required: true },
    { name: "period_label", label: "Dönem (örn. 2026-07)", required: true },
    { name: "amount", label: "Tutar (₺)", type: "number", required: true },
    { name: "due_date", label: "Son Ödeme Tarihi", type: "date" },
    { name: "is_paid", label: "Ödendi", type: "checkbox" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/player-fees"
      title="Aidatlar"
      titleField="period_label"
      subtitleField="amount"
      fields={fields}
    />
  );
}
