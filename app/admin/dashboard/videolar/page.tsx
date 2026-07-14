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
    { name: "title", label: "Video Başlığı", required: true },
    { name: "description", label: "Açıklama", type: "textarea" },
    { name: "video_url", label: "Video Dosyası", type: "video", folder: "videos-tv", required: true },
    { name: "category", label: "Kategori", type: "select", required: true,
      options: [
        { value: "mac_ozeti", label: "Maç Özeti" },
        { value: "roportaj", label: "Röportaj" },
        { value: "antrenman", label: "Antrenman Videosu" },
        { value: "canli_yayin", label: "Canlı Yayın" },
      ] },
    { name: "team_id", label: "Takım / Kategori (opsiyonel)", type: "select", options: teamOptions },
    { name: "is_published", label: "Yayınla", type: "checkbox" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/videos"
      title="Videolar (Tunaspor TV+)"
      titleField="title"
      subtitleField="category"
      fields={fields}
    />
  );
}
