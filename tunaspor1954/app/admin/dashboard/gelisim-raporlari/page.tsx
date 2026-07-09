"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/player-development-reports"
      title="Gelişim Raporları"
      titleField="period_label"
      subtitleField="content"
      fields={[
        { name: "player_id", label: "Oyuncu ID (uuid)", required: true },
        { name: "period_label", label: "Dönem (örn. 2026 Yaz Sezonu)", required: true },
        { name: "content", label: "Rapor İçeriği", type: "textarea", required: true },
      ]}
    />
  );
}
