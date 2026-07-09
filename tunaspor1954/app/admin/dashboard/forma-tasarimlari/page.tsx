"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/jersey-designs"
      title="Forma Tasarımları"
      titleField="designer_name"
      subtitleField="player_name"
      fields={[
        { name: "designer_name", label: "Tasarımcı", required: true },
        { name: "primary_color", label: "Ana Renk (hex)" },
        { name: "secondary_color", label: "Desen Rengi (hex)" },
        { name: "pattern", label: "Desen", type: "select",
          options: [
            { value: "duz", label: "Düz Kenar" },
            { value: "cizgili", label: "Çizgili" },
            { value: "capraz", label: "Çapraz Bant" },
          ] },
        { name: "player_name", label: "Sırt İsmi" },
        { name: "player_number", label: "Numara" },
        { name: "votes", label: "Oy Sayısı", type: "number" },
        { name: "is_approved", label: "Onaylandı (yayınla)", type: "checkbox" },
      ]}
    />
  );
}
