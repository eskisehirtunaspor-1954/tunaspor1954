"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <div>
      <GenericCrudManager
        apiPath="/api/admin/languages"
        title="Diller"
        titleField="name"
        subtitleField="code"
        fields={[
          { name: "code", label: "Dil Kodu (tr, en, de...)", required: true },
          { name: "name", label: "Dil Adı", required: true },
          { name: "is_default", label: "Varsayılan Dil", type: "checkbox" },
          { name: "is_active", label: "Aktif", type: "checkbox" },
        ]}
      />
      <GenericCrudManager
        apiPath="/api/admin/translations"
        title="Çeviriler"
        titleField="key"
        subtitleField="lang_code"
        fields={[
          { name: "namespace", label: "Namespace (nav, home, common...)", required: true },
          { name: "key", label: "Anahtar", required: true },
          { name: "lang_code", label: "Dil Kodu", required: true },
          { name: "value", label: "Çeviri Metni", type: "textarea", required: true },
        ]}
      />
    </div>
  );
}
