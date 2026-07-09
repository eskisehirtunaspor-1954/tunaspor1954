"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <div>
      <GenericCrudManager
        apiPath="/api/admin/gallery-albums"
        title="Galeri Albümleri"
        titleField="title"
        subtitleField="media_type"
        fields={[
          { name: "title", label: "Albüm Başlığı", required: true },
          { name: "team_id", label: "Takım ID (uuid, opsiyonel)" },
          { name: "media_type", label: "Kategori", type: "select", required: true, options: [
            { value: "fotograf", label: "Fotoğraf" },
            { value: "drone", label: "Drone Görüntüsü" },
          ]},
          { name: "cover_image_url", label: "Kapak Görseli URL" },
          { name: "is_published", label: "Yayınla", type: "checkbox" },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-sm text-tuna-mist glass-panel p-4 mb-4">
          Bir albüme birden fazla fotoğraf eklemek için aşağıya albümün ID'sini
          (yukarıdaki listede "Düzenle"ye basınca formda görünür) ve fotoğraf
          URL'lerini girin — bu fotoğraflar galeri sayfasında lightbox içinde sırayla açılır.
        </p>
      </div>
      <GenericCrudManager
        apiPath="/api/admin/gallery-photos"
        title="Albüm Fotoğrafları"
        titleField="image_url"
        subtitleField="caption"
        fields={[
          { name: "album_id", label: "Albüm ID (uuid)", required: true },
          { name: "image_url", label: "Fotoğraf URL", required: true },
          { name: "caption", label: "Açıklama" },
          { name: "sort_order", label: "Sıralama", type: "number" },
        ]}
      />
    </div>
  );
}
