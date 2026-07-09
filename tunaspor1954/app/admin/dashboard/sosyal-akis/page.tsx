"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <p className="text-sm text-tuna-mist glass-panel p-4 mb-4">
          Buraya eklediğin her gönderi, ana sayfadaki Instagram tarzı sosyal medya
          akışında görünür. "Gönderi URL" alanına gerçek Instagram/Facebook/X
          gönderisinin linkini yapıştır — ziyaretçi görsele tıklayınca oraya yönlenir.
        </p>
      </div>
      <GenericCrudManager
        apiPath="/api/admin/social-posts"
        title="Sosyal Medya Akışı"
        titleField="caption"
        subtitleField="platform"
        fields={[
          { name: "platform", label: "Platform", type: "select", required: true, options: [
            { value: "instagram", label: "Instagram" },
            { value: "facebook", label: "Facebook" },
            { value: "twitter", label: "X (Twitter)" },
            { value: "tiktok", label: "TikTok" },
          ]},
          { name: "image_url", label: "Görsel URL", required: true },
          { name: "caption", label: "Açıklama" },
          { name: "post_url", label: "Gerçek Gönderi URL (tıklanınca gidilecek)", required: true },
          { name: "likes_count", label: "Beğeni Sayısı (kozmetik)", type: "number" },
          { name: "sort_order", label: "Sıralama", type: "number" },
          { name: "is_published", label: "Yayınla", type: "checkbox" },
        ]}
      />
    </div>
  );
}
