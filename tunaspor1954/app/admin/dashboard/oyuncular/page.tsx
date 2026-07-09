"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/players"
      title="Oyuncular"
      titleField="full_name"
      subtitleField="position"
      fields={[
        { name: "team_id", label: "Takım ID (uuid)", required: true },
        { name: "full_name", label: "Ad Soyad", required: true },
        { name: "position", label: "Mevki" },
        { name: "jersey_number", label: "Forma No", type: "number" },
        { name: "birth_date", label: "Doğum Tarihi", type: "date" },
        { name: "nationality", label: "Uyruk" },
        { name: "photo_url", label: "Fotoğraf URL" },
        { name: "bio", label: "Biyografi", type: "textarea" },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
