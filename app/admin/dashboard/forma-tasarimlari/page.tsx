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
        { name: "secondary_color", label: "2. Renk (hex)" },
        { name: "tertiary_color", label: "3. Renk (hex)" },
        { name: "pattern", label: "Desen", type: "select",
          options: [
            { value: "duz", label: "Düz" },
            { value: "cizgili", label: "Çizgili" },
            { value: "capraz", label: "Çapraz Bant" },
            { value: "parcali", label: "Parçalı" },
            { value: "geometrik", label: "Geometrik" },
            { value: "kamuflaj", label: "Kamuflaj" },
            { value: "gradient", label: "Gradient" },
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
        { name: "text_color", label: "Yazı Rengi (hex)" },
        { name: "text_font", label: "Yazı Tipi" },
        { name: "text_effect", label: "Yazı Efekti", type: "select", options: [
          { value: "yok", label: "Yok" },
          { value: "kontur", label: "Kontur" },
          { value: "golge", label: "Gölge" },
          { value: "kabartma", label: "Kabartma" },
        ]},
        { name: "votes", label: "Oy Sayısı", type: "number" },
        { name: "is_approved", label: "Onaylandı (yayınla)", type: "checkbox" },
      ]}
    />
  );
}
