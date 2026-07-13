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
    { name: "team_id", label: "Takım / Kategori", type: "select", options: teamOptions, required: true },
    { name: "full_name", label: "Ad Soyad", required: true },
    { name: "position", label: "Mevki" },
    { name: "jersey_number", label: "Forma No", type: "number" },
    { name: "birth_date", label: "Doğum Tarihi", type: "date" },
    { name: "height_cm", label: "Boy (cm)", type: "number" },
    { name: "weight_kg", label: "Kilo (kg)", type: "number" },
    { name: "nationality", label: "Uyruk" },
    { name: "photo_url", label: "Fotoğraf URL" },
    { name: "bio", label: "Biyografi", type: "textarea" },
    { name: "is_published", label: "Yayınla", type: "checkbox" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/players"
      title="Oyuncular"
      titleField="full_name"
      subtitleField="position"
      fields={fields}
    />
  );
}
