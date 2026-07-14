"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/game-scores"
      title="Mini Oyun Skorları"
      titleField="nickname"
      subtitleField="game_type"
      fields={[
        { name: "nickname", label: "Rumuz", required: true },
        { name: "score", label: "Skor (0-5)", type: "number", required: true },
        { name: "game_type", label: "Oyun", type: "select", options: [
          { value: "penalti", label: "Penaltı Atışı" },
          { value: "serbest_vurus", label: "Serbest Vuruş" },
          { value: "kaleci_kurtaris", label: "Kaleci Kurtarış" },
          { value: "top_sektirme", label: "Top Sektirme" },
          { value: "slalom_dripling", label: "Slalom & Dripling" },
        ]},
      ]}
    />
  );
}
