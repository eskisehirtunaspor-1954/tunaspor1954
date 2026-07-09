"use client";

import { useEffect, useState } from "react";

const PLATFORMS = ["instagram", "facebook", "youtube", "twitter", "tiktok"];

export default function Page() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/social-links")
      .then((r) => r.json())
      .then((d) => setLinks(d.data ?? {}));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/social-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(links),
    });
    setSaving(false);
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">Sosyal Medya</h1>
      <form onSubmit={save} className="glass-panel p-6 space-y-3">
        {PLATFORMS.map((p) => (
          <input
            key={p}
            placeholder={`${p} URL`}
            value={links[p] ?? ""}
            onChange={(e) => setLinks({ ...links, [p]: e.target.value })}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
        ))}
        <button disabled={saving} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
