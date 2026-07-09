"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/calendar-items"
      title="Akıllı Kulüp Takvimi"
      titleField="title"
      subtitleField="type"
      fields={[
        { name: "team_id", label: "Takım ID (uuid, opsiyonel)" },
        { name: "type", label: "Tür", type: "select", required: true, options: [
          { value: "mac", label: "Maç" },
          { value: "antrenman", label: "Antrenman" },
          { value: "etkinlik", label: "Etkinlik" },
          { value: "yaz_kampi", label: "Yaz Kampı" },
          { value: "secme", label: "Seçme" },
          { value: "duyuru", label: "Duyuru" },
        ]},
        { name: "title", label: "Başlık", required: true },
        { name: "start_time", label: "Başlangıç", type: "datetime-local", required: true },
        { name: "end_time", label: "Bitiş", type: "datetime-local" },
        { name: "location", label: "Konum" },
        { name: "notes", label: "Notlar", type: "textarea" },
      ]}
    />
  );
}
