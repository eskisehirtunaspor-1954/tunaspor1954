"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";
import { BulkImageUpload } from "@/components/admin/BulkImageUpload";

interface Album {
  id: string;
  title: string;
}

export default function Page() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);
  const [bulkAlbumId, setBulkAlbumId] = useState("");
  const [photosKey, setPhotosKey] = useState(0);

  function loadAlbums() {
    fetch("/api/admin/gallery-albums")
      .then((r) => r.json())
      .then((d) => setAlbums(d.data ?? []));
  }
  useEffect(() => {
    loadAlbums();
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => setTeamOptions((d.data ?? []).map((t: any) => ({ value: t.id, label: t.display_name }))));
  }, []);

  async function handleUploaded(url: string) {
    await fetch("/api/admin/gallery-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album_id: bulkAlbumId, image_url: url }),
    });
  }

  const albumOptions = albums.map((a) => ({ value: a.id, label: a.title }));

  return (
    <div>
      <GenericCrudManager
        apiPath="/api/admin/gallery-albums"
        title="Galeri Albümleri"
        titleField="title"
        subtitleField="media_type"
        fields={[
          { name: "title", label: "Albüm Başlığı", required: true },
          { name: "team_id", label: "Takım / Kategori (opsiyonel)", type: "select", options: teamOptions },
          { name: "media_type", label: "Kategori", type: "select", required: true, options: [
            { value: "fotograf", label: "Fotoğraf" },
            { value: "drone", label: "Drone Görüntüsü" },
          ]},
          { name: "cover_image_url", label: "Kapak Görseli", type: "image", folder: "gallery" },
          { name: "is_published", label: "Yayınla", type: "checkbox" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4">
        <div className="glass-panel p-6 mb-4 space-y-3">
          <h2 className="font-semibold">Çoklu Fotoğraf Yükle</h2>
          <p className="text-sm text-tuna-mist">
            Bir albüm seçip birden fazla fotoğrafı aynı anda sürükleyip bırakabilirsiniz —
            her biri otomatik olarak seçili albüme eklenir.
          </p>
          <select
            value={bulkAlbumId}
            onChange={(e) => setBulkAlbumId(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          >
            <option value="">Albüm seçin</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <BulkImageUpload
            folder="gallery"
            disabled={!bulkAlbumId}
            disabledHint="Fotoğraf yüklemeden önce yukarıdan bir albüm seçin."
            onEachUploaded={async (url) => {
              await handleUploaded(url);
              setPhotosKey((k) => k + 1);
            }}
          />
        </div>
      </div>

      <GenericCrudManager
        key={photosKey}
        apiPath="/api/admin/gallery-photos"
        title="Albüm Fotoğrafları"
        titleField="image_url"
        subtitleField="caption"
        fields={[
          { name: "album_id", label: "Albüm", type: "select", options: albumOptions, required: true },
          { name: "image_url", label: "Fotoğraf", type: "image", folder: "gallery", required: true },
          { name: "caption", label: "Açıklama" },
          { name: "sort_order", label: "Sıralama", type: "number" },
        ]}
      />
    </div>
  );
}
