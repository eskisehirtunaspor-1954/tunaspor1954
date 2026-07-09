"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/academy-announcements"
      title="Akademi Duyuruları (Veli Paneli)"
      titleField="title"
      subtitleField="content"
      fields={[
        { name: "title", label: "Başlık", required: true },
        { name: "content", label: "İçerik", type: "textarea", required: true },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
