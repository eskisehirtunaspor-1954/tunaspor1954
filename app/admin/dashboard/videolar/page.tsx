"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/videos"
      title="Videolar (Tunaspor TV+)"
      titleField="title"
      subtitleField="youtube_id"
      fields={[
        { name: "title", label: "Video Başlığı", required: true },
        { name: "description", label: "Açıklama", type: "textarea" },
        { name: "youtube_id", label: "YouTube Video ID", required: true },
        { name: "category", label: "Kategori", type: "select", required: true,
          options: [
            { value: "mac_ozeti", label: "Maç Özeti" },
            { value: "roportaj", label: "Röportaj" },
            { value: "antrenman", label: "Antrenman Videosu" },
            { value: "canli_yayin", label: "Canlı Yayın" },
          ] },
        { name: "team_id", label: "Takım ID (uuid, opsiyonel)" },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
