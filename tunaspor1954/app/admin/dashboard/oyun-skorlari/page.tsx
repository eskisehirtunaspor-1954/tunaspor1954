"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/game-scores"
      title="Mini Oyun Skorları"
      titleField="nickname"
      subtitleField="score"
      fields={[
        { name: "nickname", label: "Rumuz", required: true },
        { name: "score", label: "Skor (0-5)", type: "number", required: true },
      ]}
    />
  );
}
