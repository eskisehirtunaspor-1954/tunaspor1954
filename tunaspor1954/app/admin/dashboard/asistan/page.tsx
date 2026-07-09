"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <p className="text-sm text-tuna-mist glass-panel p-4 mb-4">
          Buraya eklediğiniz her konu, sağ-alt köşedeki AI Kulüp Asistanı'nın
          yanıt verirken kullandığı bilgi tabanına eklenir. Asistan yalnızca
          burada aktif olan içeriklere dayanarak yanıt üretir.
        </p>
      </div>
      <GenericCrudManager
        apiPath="/api/admin/ai-knowledge-base"
        title="Yapay Zekâ Asistanı — Bilgi Tabanı"
        titleField="topic"
        fields={[
          { name: "topic", label: "Konu Başlığı", required: true },
          { name: "content", label: "İçerik", type: "textarea", required: true },
          { name: "is_active", label: "Aktif", type: "checkbox" },
        ]}
      />
    </div>
  );
}
