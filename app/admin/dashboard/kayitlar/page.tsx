"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

export default function Page() {
  const [eventOptions, setEventOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => setEventOptions((d.data ?? []).map((e: any) => ({ value: e.id, label: e.title }))));
  }, []);

  const fields: FieldDef[] = [
    { name: "event_id", label: "Etkinlik", type: "select", options: eventOptions, required: true },
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
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/event-registrations"
      title="Etkinlik Kayıt Başvuruları"
      titleField="full_name"
      subtitleField="status"
      fields={fields}
    />
  );
}
