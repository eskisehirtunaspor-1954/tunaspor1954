"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/league-table"
      title="Canlı Lig Durumu — Puan Tablosu"
      titleField="team_name"
      subtitleField="league_name"
      fields={[
        { name: "league_name", label: "Lig Adı", required: true },
        { name: "season", label: "Sezon (ör. 2025-2026)", required: true },
        { name: "team_name", label: "Takım Adı", required: true },
        { name: "is_own_team", label: "Bu Tunaspor 1954 (vurgulanır)", type: "checkbox" },
        { name: "rank", label: "Sıra", type: "number", required: true },
        { name: "played", label: "Oynanan", type: "number" },
        { name: "won", label: "Galibiyet", type: "number" },
        { name: "drawn", label: "Beraberlik", type: "number" },
        { name: "lost", label: "Mağlubiyet", type: "number" },
        { name: "goals_for", label: "Attığı Gol", type: "number" },
        { name: "goals_against", label: "Yediği Gol", type: "number" },
        { name: "points", label: "Puan", type: "number", required: true },
      ]}
    />
  );
}
