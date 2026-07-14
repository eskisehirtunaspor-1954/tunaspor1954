"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

export default function Page() {
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => setTeamOptions((d.data ?? []).map((t: any) => ({ value: t.id, label: t.display_name }))));
  }, []);

  const fields: FieldDef[] = [
    { name: "team_id", label: "Takım / Kategori (opsiyonel)", type: "select", options: teamOptions },
    { name: "full_name", label: "Ad Soyad", required: true },
    { name: "role", label: "Görev", required: true },
    { name: "photo_url", label: "Fotoğraf", type: "image", folder: "staff" },
    { name: "bio", label: "Biyografi", type: "textarea" },
    { name: "is_published", label: "Yayınla", type: "checkbox" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/staff"
      title="Personeller"
      titleField="full_name"
      subtitleField="role"
      fields={fields}
    />
  );
}
