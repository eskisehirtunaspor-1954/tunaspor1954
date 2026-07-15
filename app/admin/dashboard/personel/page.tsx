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
    { name: "department", label: "Bağlı Olduğu Birim (ör. Sağlık Ekibi, Teknik Kadro)" },
    { name: "photo_url", label: "Fotoğraf", type: "image", folder: "staff" },
    { name: "phone", label: "Telefon (opsiyonel)" },
    { name: "email", label: "E-posta (opsiyonel)" },
    { name: "license_info", label: "Lisans Bilgisi" },
    { name: "start_date", label: "Göreve Başlama Tarihi", type: "date" },
    { name: "bio", label: "Özgeçmiş", type: "textarea" },
    { name: "description", label: "Kısa Açıklama", type: "textarea" },
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
