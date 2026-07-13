"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/staff"
      title="Personeller"
      titleField="full_name"
      subtitleField="role"
      fields={[
        { name: "team_id", label: "Takım ID (uuid, opsiyonel)" },
        { name: "full_name", label: "Ad Soyad", required: true },
        { name: "role", label: "Görev", required: true },
        { name: "photo_url", label: "Fotoğraf", type: "image", folder: "staff" },
        { name: "bio", label: "Biyografi", type: "textarea" },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
