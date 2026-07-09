"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

const CATEGORIES = ["a_takim","kadin_takimi","u18","u17","u16","u15","u14","u13","u12","u11","u10","u9"];

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/teams"
      title="Takımlar"
      titleField="display_name"
      subtitleField="coach_name"
      fields={[
        { name: "category", label: "Kategori", type: "select", required: true,
          options: CATEGORIES.map((c) => ({ value: c, label: c })) },
        { name: "display_name", label: "Görünen Ad", required: true },
        { name: "coach_name", label: "Antrenör Adı" },
        { name: "description", label: "Açıklama", type: "textarea" },
        { name: "founded_year", label: "Kuruluş Yılı", type: "number" },
        { name: "cover_image_url", label: "Kapak Görseli URL" },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
