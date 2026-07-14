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
        { name: "kit_type", label: "Forma Türü", type: "select", options: [
          { value: "ev_sahibi", label: "Ev Sahibi" },
          { value: "deplasman", label: "Deplasman" },
          { value: "kaleci", label: "Kaleci" },
          { value: "antrenman", label: "Antrenman" },
        ]},
        { name: "collar_type", label: "Yaka Tipi", type: "select", options: [
          { value: "bisiklet", label: "Bisiklet Yaka" },
          { value: "polo", label: "Polo Yaka" },
          { value: "v_yaka", label: "V Yaka" },
        ]},
        { name: "sleeve_type", label: "Kol Tipi", type: "select", options: [
          { value: "kisa", label: "Kısa Kol" },
          { value: "uzun", label: "Uzun Kol" },
        ]},
        { name: "fabric", label: "Kumaş Dokusu", type: "select", options: [
          { value: "klasik", label: "Klasik" },
          { value: "mat", label: "Mat" },
          { value: "parlak", label: "Parlak" },
        ]},
        { name: "shorts_color", label: "Şort Rengi (hex)" },
        { name: "socks_color", label: "Çorap Rengi (hex)" },
        { name: "votes", label: "Oy Sayısı", type: "number" },
        { name: "is_approved", label: "Onaylandı (yayınla)", type: "checkbox" },
      ]}
    />
  );
}
