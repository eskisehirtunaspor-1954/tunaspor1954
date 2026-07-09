"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/seo-settings"
      title="SEO Paneli"
      titleField="page_path"
      subtitleField="meta_title"
      fields={[
        { name: "page_path", label: "Sayfa Yolu (/haberler gibi)", required: true },
        { name: "meta_title", label: "Meta Başlık" },
        { name: "meta_description", label: "Meta Açıklama", type: "textarea" },
        { name: "keywords", label: "Anahtar Kelimeler" },
        { name: "og_image_url", label: "Open Graph Görsel URL" },
        { name: "twitter_card", label: "Twitter Card Türü" },
      ]}
    />
  );
}
