"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/supporter-wall"
      title="Dijital Destekçi Duvarı"
      titleField="supporter_name"
      subtitleField="message"
      fields={[
        { name: "supporter_name", label: "İsim / Kurum", required: true },
        { name: "supporter_logo_url", label: "Logo", type: "image", folder: "supporters" },
        { name: "message", label: "Mesaj", type: "textarea", required: true },
        { name: "is_approved", label: "Onaylandı (yayınla)", type: "checkbox" },
      ]}
    />
  );
}
