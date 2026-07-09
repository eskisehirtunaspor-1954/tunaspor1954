"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/training-sessions"
      title="Akıllı Antrenman Takibi"
      titleField="session_date"
      subtitleField="status"
      fields={[
        { name: "team_id", label: "Takım ID (uuid)", required: true },
        { name: "session_date", label: "Tarih", type: "date", required: true },
        { name: "start_time", label: "Başlangıç Saati", required: true },
        { name: "end_time", label: "Bitiş Saati" },
        { name: "venue", label: "Saha" },
        { name: "coach_id", label: "Antrenör ID (uuid)" },
        { name: "status", label: "Durum", type: "select", options: [
          { value: "scheduled", label: "Planlandı" },
          { value: "completed", label: "Tamamlandı" },
          { value: "cancelled", label: "İptal" },
          { value: "rescheduled", label: "Ertelendi" },
        ]},
        { name: "notes", label: "Notlar", type: "textarea" },
      ]}
    />
  );
}
