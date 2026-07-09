"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/player-fees"
      title="Aidatlar"
      titleField="period_label"
      subtitleField="amount"
      fields={[
        { name: "player_id", label: "Oyuncu ID (uuid)", required: true },
        { name: "period_label", label: "Dönem (örn. 2026-07)", required: true },
        { name: "amount", label: "Tutar (₺)", type: "number", required: true },
        { name: "due_date", label: "Son Ödeme Tarihi", type: "date" },
        { name: "is_paid", label: "Ödendi", type: "checkbox" },
      ]}
    />
  );
}
