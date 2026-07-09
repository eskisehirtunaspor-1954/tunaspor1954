"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/training-attendance"
      title="Antrenman Devam Durumu"
      titleField="status"
      subtitleField="note"
      fields={[
        { name: "session_id", label: "Antrenman Oturumu ID (uuid)", required: true },
        { name: "player_id", label: "Oyuncu ID (uuid)", required: true },
        { name: "status", label: "Durum", type: "select", required: true,
          options: [
            { value: "katildi", label: "Katıldı" },
            { value: "katilmadi", label: "Katılmadı" },
            { value: "izinli", label: "İzinli" },
          ] },
        { name: "note", label: "Not (opsiyonel)" },
      ]}
    />
  );
}
