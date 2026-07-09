"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/event-registrations"
      title="Etkinlik Kayıt Başvuruları"
      titleField="full_name"
      subtitleField="status"
      fields={[
        { name: "event_id", label: "Etkinlik ID (uuid)", required: true },
        { name: "full_name", label: "Ad Soyad", required: true },
        { name: "phone", label: "Telefon", required: true },
        { name: "email", label: "E-posta" },
        { name: "parent_name", label: "Veli Adı" },
        { name: "notes", label: "Notlar", type: "textarea" },
        { name: "status", label: "Durum", type: "select", options: [
          { value: "pending", label: "Beklemede" },
          { value: "approved", label: "Onaylandı" },
          { value: "rejected", label: "Reddedildi" },
          { value: "waitlisted", label: "Bekleme Listesi" },
        ]},
      ]}
    />
  );
}
