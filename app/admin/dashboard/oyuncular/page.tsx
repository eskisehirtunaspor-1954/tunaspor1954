"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

export default function Page() {
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => setTeamOptions((d.data ?? []).map((t: any) => ({ value: t.id, label: t.display_name }))));
  }, []);

  const fields: FieldDef[] = [
    { name: "team_id", label: "Takım / Kategori", type: "select", options: teamOptions, required: true },
    { name: "full_name", label: "Ad Soyad", required: true },
    { name: "position", label: "Mevki" },
    { name: "jersey_number", label: "Forma No", type: "number" },
    { name: "birth_date", label: "Doğum Tarihi", type: "date" },
    { name: "height_cm", label: "Boy (cm)", type: "number" },
    { name: "weight_kg", label: "Kilo (kg)", type: "number" },
    { name: "nationality", label: "Uyruk" },
    { name: "photo_url", label: "Fotoğraf", type: "image" },
    { name: "license_no", label: "Lisans Numarası" },
    {
      name: "preferred_foot",
      label: "Ayak Tercihi",
      type: "select",
      options: [
        { value: "sag", label: "Sağ" },
        { value: "sol", label: "Sol" },
        { value: "cift", label: "Çift" },
      ],
    },
    { name: "joined_at", label: "Takıma Katılış Tarihi", type: "date" },
    { name: "bio", label: "Biyografi", type: "textarea" },
    { name: "is_published", label: "Yayınla", type: "checkbox" },
    { name: "parent_name", label: "Veli Adı Soyadı" },
    { name: "parent_phone", label: "Veli Telefonu" },
    { name: "parent_email", label: "Veli E-postası" },
    { name: "missed_trainings_count", label: "Katılmadığı Antrenman Sayısı (otomatik, elle düzeltilebilir)", type: "number" },
    { name: "fee_paid_total", label: "Ödenen Aidat (₺)", type: "number" },
    { name: "fee_balance", label: "Kalan Aidat Borcu (₺)", type: "number" },
    { name: "fee_last_payment_at", label: "Son Ödeme Tarihi", type: "date" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/players"
      title="Oyuncular"
      titleField="full_name"
      subtitleField="position"
      fields={fields}
    />
  );
}
