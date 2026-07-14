"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

export default function Page() {
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => setTeamOptions((d.data ?? []).map((t: any) => ({ value: t.id, label: t.display_name }))));
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((d) => setStaffOptions((d.data ?? []).map((s: any) => ({ value: s.id, label: `${s.full_name}${s.role ? ` (${s.role})` : ""}` }))));
  }, []);

  const fields: FieldDef[] = [
    { name: "team_id", label: "Takım / Kategori", type: "select", options: teamOptions, required: true },
    { name: "session_date", label: "Tarih", type: "date", required: true },
    { name: "start_time", label: "Başlangıç Saati", required: true },
    { name: "end_time", label: "Bitiş Saati" },
    { name: "venue", label: "Saha" },
    { name: "coach_id", label: "Antrenör", type: "select", options: staffOptions },
    { name: "status", label: "Durum", type: "select", options: [
      { value: "scheduled", label: "Planlandı" },
      { value: "completed", label: "Tamamlandı" },
      { value: "cancelled", label: "İptal" },
      { value: "rescheduled", label: "Ertelendi" },
    ]},
    { name: "notes", label: "Notlar", type: "textarea" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/training-sessions"
      title="Akıllı Antrenman Takibi"
      titleField="session_date"
      subtitleField="status"
      fields={fields}
    />
  );
}
