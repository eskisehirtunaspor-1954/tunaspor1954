"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/scout-contact-requests"
      title="Scout İletişim Talepleri"
      titleField="message"
      subtitleField="created_at"
      fields={[
        { name: "scout_id", label: "Scout ID" },
        { name: "player_id", label: "Oyuncu ID" },
        { name: "message", label: "Mesaj", type: "textarea" },
      ]}
    />
  );
}
