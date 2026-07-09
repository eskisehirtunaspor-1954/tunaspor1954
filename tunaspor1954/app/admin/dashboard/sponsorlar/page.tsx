"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/sponsors"
      title="Sponsorlar"
      titleField="name"
      subtitleField="tier"
      fields={[
        { name: "name", label: "Sponsor Adı", required: true },
        { name: "logo_url", label: "Logo URL", required: true },
        { name: "website_url", label: "Web Sitesi" },
        { name: "tier", label: "Seviye", type: "select", required: true, options: [
          { value: "ana_sponsor", label: "Ana Sponsor" },
          { value: "platin", label: "Platin" },
          { value: "altin", label: "Altın" },
          { value: "destekci", label: "Destekçi" },
        ]},
        { name: "sort_order", label: "Sıralama", type: "number" },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
