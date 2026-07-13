"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/events"
      title="Etkinlikler"
      titleField="title"
      subtitleField="type"
      fields={[
        { name: "title", label: "Başlık", required: true },
        { name: "type", label: "Tür", type: "select", required: true, options: [
          { value: "yaz_kampi", label: "Yaz Futbol Kampı" },
          { value: "turnuva", label: "Turnuva" },
          { value: "secme", label: "Seçme" },
          { value: "seminer", label: "Seminer" },
          { value: "etkinlik", label: "Etkinlik" },
        ]},
        { name: "description", label: "Açıklama", type: "textarea" },
        { name: "start_date", label: "Başlangıç", type: "datetime-local", required: true },
        { name: "end_date", label: "Bitiş", type: "datetime-local" },
        { name: "location", label: "Konum" },
        { name: "capacity", label: "Kontenjan", type: "number" },
        { name: "price", label: "Ücret", type: "number" },
        { name: "cover_image_url", label: "Kapak Görseli", type: "image", folder: "events" },
        { name: "registration_open", label: "Kayıt Açık", type: "checkbox" },
      ]}
    />
  );
}
