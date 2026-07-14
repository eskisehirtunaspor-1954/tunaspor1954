"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

export default function Page() {
  const [scoutOptions, setScoutOptions] = useState<{ value: string; label: string }[]>([]);
  const [playerOptions, setPlayerOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/scout-accounts")
      .then((r) => r.json())
      .then((d) => setScoutOptions((d.data ?? []).map((s: any) => ({ value: s.id, label: `${s.club_name} — ${s.contact_name}` }))));
    fetch("/api/admin/players")
      .then((r) => r.json())
      .then((d) => setPlayerOptions((d.data ?? []).map((p: any) => ({ value: p.id, label: p.full_name }))));
  }, []);

  const fields: FieldDef[] = [
    { name: "scout_id", label: "Scout", type: "select", options: scoutOptions },
    { name: "player_id", label: "Oyuncu", type: "select", options: playerOptions },
    { name: "message", label: "Mesaj", type: "textarea" },
  ];

  return (
    <GenericCrudManager
      apiPath="/api/admin/scout-contact-requests"
      title="Scout İletişim Talepleri"
      titleField="message"
      subtitleField="created_at"
      fields={fields}
    />
  );
}
