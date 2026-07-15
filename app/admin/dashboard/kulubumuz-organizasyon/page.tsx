"use client";

import { useEffect, useState } from "react";
import { buildOrgTree, type OrgNode, type OrgNodeRow } from "@/lib/org-tree";
import { uploadFile } from "@/lib/admin/upload-client";

interface Staff {
  id: string;
  full_name: string;
  role: string;
}

interface Baskan {
  photo_url?: string;
  name?: string;
  title?: string;
  message?: string;
  video_url?: string;
  pdf_url?: string;
}

const NODE_TYPE_LABEL: Record<OrgNodeRow["node_type"], string> = {
  baslik: "Başlık",
  personel: "Personel",
  sayfa_baglantisi: "Sayfa Bağlantısı",
  metin: "Metin",
};

function BaskanMesajiEditor() {
  const [data, setData] = useState<Baskan>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/baskan-mesaji").then((r) => r.json()).then((d) => setData(d.data ?? {}));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/baskan-mesaji", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, "baskan", "image");
      setData((d) => ({ ...d, photo_url: result.url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={save} className="glass-panel p-6 space-y-3">
      <h2 className="font-semibold mb-2">Başkanın Mesajı</h2>
      <div className="flex items-center gap-3">
        {data.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border border-tuna-gold/30" />
        )}
        <label className="text-xs text-tuna-mist">
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <span className="cursor-pointer border border-white/15 rounded-full px-3 py-1.5 hover:border-white/30" onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement)?.click()}>
            {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
          </span>
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          placeholder="Başkan Adı Soyadı"
          value={data.name ?? ""}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          placeholder="Unvan (ör. Kulüp Başkanı)"
          value={data.title ?? ""}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </div>
      <textarea
        placeholder="Mesaj metni"
        value={data.message ?? ""}
        onChange={(e) => setData({ ...data, message: e.target.value })}
        rows={5}
        className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
      />
      <div className="grid md:grid-cols-2 gap-3">
        <input
          placeholder="Video Mesaj URL (opsiyonel)"
          value={data.video_url ?? ""}
          onChange={(e) => setData({ ...data, video_url: e.target.value })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          placeholder="PDF Mesaj URL (opsiyonel)"
          value={data.pdf_url ?? ""}
          onChange={(e) => setData({ ...data, pdf_url: e.target.value })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </div>
      <button disabled={saving} className="bg-tuna-yellow text-tuna-black font-semibold px-5 py-2 rounded-lg disabled:opacity-50">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function NewNodeForm({
  parentId, staffList, onCreated, onCancel,
}: { parentId: string | null; staffList: Staff[]; onCreated: () => void; onCancel?: () => void }) {
  const [title, setTitle] = useState("");
  const [nodeType, setNodeType] = useState<OrgNodeRow["node_type"]>("baslik");
  const [staffId, setStaffId] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/admin/org-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parent_id: parentId,
        title,
        node_type: nodeType,
        staff_id: nodeType === "personel" ? staffId || null : null,
        link_href: nodeType === "sayfa_baglantisi" ? linkHref || null : null,
        content: nodeType === "metin" ? content || null : null,
      }),
    });
    setSaving(false);
    setTitle("");
    setContent("");
    setLinkHref("");
    onCreated();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 bg-white/5 rounded-lg p-2 mt-2">
      <select
        value={nodeType}
        onChange={(e) => setNodeType(e.target.value as OrgNodeRow["node_type"])}
        className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10"
      >
        {Object.entries(NODE_TYPE_LABEL).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <input
        placeholder="Başlık"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10 flex-1 min-w-[120px]"
      />
      {nodeType === "personel" && (
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10">
          <option value="">Personel seç</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name} — {s.role}</option>
          ))}
        </select>
      )}
      {nodeType === "sayfa_baglantisi" && (
        <input placeholder="/sponsorlar" value={linkHref} onChange={(e) => setLinkHref(e.target.value)} className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10" />
      )}
      {nodeType === "metin" && (
        <input placeholder="Kısa metin" value={content} onChange={(e) => setContent(e.target.value)} className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10 flex-1" />
      )}
      <button disabled={saving} className="bg-tuna-yellow text-tuna-black text-xs font-semibold px-3 py-1.5 rounded">
        Ekle
      </button>
      {onCancel && <button type="button" onClick={onCancel} className="text-xs text-tuna-mist">İptal</button>}
    </form>
  );
}

function EditNodeForm({ node, staffList, onSaved, onCancel }: { node: OrgNode; staffList: Staff[]; onSaved: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(node.title);
  const [staffId, setStaffId] = useState(node.staff_id ?? "");
  const [linkHref, setLinkHref] = useState(node.link_href ?? "");
  const [content, setContent] = useState(node.content ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/admin/org-nodes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: node.id,
        title,
        staff_id: node.node_type === "personel" ? staffId || null : undefined,
        link_href: node.node_type === "sayfa_baglantisi" ? linkHref || null : undefined,
        content: node.node_type === "metin" ? content || null : undefined,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 bg-white/5 rounded-lg p-2 mt-2">
      <input
        placeholder="Başlık"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10 flex-1 min-w-[120px]"
      />
      {node.node_type === "personel" && (
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10">
          <option value="">Personel seç (fotoğraflı kart için)</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name} — {s.role}</option>
          ))}
        </select>
      )}
      {node.node_type === "sayfa_baglantisi" && (
        <input placeholder="/sponsorlar" value={linkHref} onChange={(e) => setLinkHref(e.target.value)} className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10" />
      )}
      {node.node_type === "metin" && (
        <input placeholder="Kısa metin" value={content} onChange={(e) => setContent(e.target.value)} className="bg-white/5 rounded px-2 py-1.5 text-xs border border-white/10 flex-1" />
      )}
      <button disabled={saving} className="bg-tuna-yellow text-tuna-black text-xs font-semibold px-3 py-1.5 rounded">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-tuna-mist">İptal</button>
    </form>
  );
}

function NodeRow({
  node, staffList, onChanged, depth, dragHandleProps, isDragging,
}: {
  node: OrgNode; staffList: Staff[]; onChanged: () => void; depth: number;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>; isDragging?: boolean;
}) {
  const [addingChild, setAddingChild] = useState(false);
  const [editing, setEditing] = useState(false);

  async function patch(updates: Record<string, unknown>) {
    await fetch("/api/admin/org-nodes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: node.id, ...updates }),
    });
    onChanged();
  }

  async function moveOrder(delta: number) {
    await patch({ display_order: node.display_order + delta });
  }

  async function softDelete() {
    if (!confirm(`"${node.title}" silinsin mi? (Daha sonra geri yüklenebilir)`)) return;
    await patch({ deleted_at: new Date().toISOString() });
  }

  return (
    <div className={depth > 0 ? "ml-5 border-l border-white/10 pl-3 mt-2" : "mt-2"}>
      <div className={`flex flex-wrap items-center gap-2 bg-white/5 rounded-lg px-3 py-2 ${isDragging ? "opacity-40" : ""}`}>
        {dragHandleProps && (
          <span {...dragHandleProps} className="text-tuna-mist select-none cursor-grab active:cursor-grabbing" title="Sürükleyerek sırala">
            ⠿
          </span>
        )}
        <span className="text-[10px] uppercase tracking-wide text-tuna-mist border border-white/15 rounded px-1.5 py-0.5">
          {NODE_TYPE_LABEL[node.node_type]}
        </span>
        <span className="text-sm font-medium flex-1">
          {node.title}
          {node.node_type === "personel" && !node.staff_id && (
            <span className="ml-2 text-[10px] text-tuna-gold/70">(personel atanmadı)</span>
          )}
        </span>
        <button onClick={() => setEditing((v) => !v)} className="text-tuna-yellow text-xs hover:underline">Düzenle</button>
        <button onClick={() => moveOrder(-1)} className="text-tuna-mist hover:text-white text-xs" title="Yukarı taşı">▲</button>
        <button onClick={() => moveOrder(1)} className="text-tuna-mist hover:text-white text-xs" title="Aşağı taşı">▼</button>
        <button onClick={() => patch({ is_active: !node.is_active })} className={`text-xs ${node.is_active ? "text-green-400" : "text-tuna-mist"}`}>
          {node.is_active ? "Aktif" : "Pasif"}
        </button>
        <button onClick={() => patch({ is_hidden: !node.is_hidden })} className={`text-xs ${node.is_hidden ? "text-tuna-gold" : "text-tuna-mist"}`}>
          {node.is_hidden ? "Gizli" : "Görünür"}
        </button>
        {node.node_type === "baslik" && (
          <button onClick={() => setAddingChild((v) => !v)} className="text-xs text-tuna-gold hover:underline">
            + Alt Öğe
          </button>
        )}
        <button onClick={softDelete} className="text-xs text-red-400 hover:underline">Sil</button>
      </div>
      {editing && (
        <EditNodeForm node={node} staffList={staffList} onSaved={() => { setEditing(false); onChanged(); }} onCancel={() => setEditing(false)} />
      )}
      {addingChild && (
        <NewNodeForm parentId={node.id} staffList={staffList} onCreated={() => { setAddingChild(false); onChanged(); }} onCancel={() => setAddingChild(false)} />
      )}
      <NodeList nodes={node.children} staffList={staffList} onChanged={onChanged} depth={depth + 1} />
    </div>
  );
}

// Aynı üst öğeye bağlı kardeş düğümler arasında sürükle-bırak sıralama —
// bırakma anında yeni sırayı yansıtan display_order değerleri PATCH ile kaydedilir.
function NodeList({ nodes, staffList, onChanged, depth }: { nodes: OrgNode[]; staffList: Staff[]; onChanged: () => void; depth: number }) {
  const [dragId, setDragId] = useState<string | null>(null);

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const from = nodes.findIndex((n) => n.id === dragId);
    const to = nodes.findIndex((n) => n.id === targetId);
    setDragId(null);
    if (from === -1 || to === -1) return;

    const reordered = [...nodes];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    await Promise.all(
      reordered.map((n, index) =>
        n.display_order === index
          ? null
          : fetch("/api/admin/org-nodes", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: n.id, display_order: index }),
            })
      )
    );
    onChanged();
  }

  return (
    <>
      {nodes.map((node) => (
        <div
          key={node.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(node.id)}
        >
          <NodeRow
            node={node}
            staffList={staffList}
            onChanged={onChanged}
            depth={depth}
            isDragging={dragId === node.id}
            dragHandleProps={{
              draggable: true,
              onDragStart: () => setDragId(node.id),
            }}
          />
        </div>
      ))}
    </>
  );
}

export default function KulubumuzOrganizasyonPage() {
  const [rows, setRows] = useState<OrgNodeRow[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  function load() {
    fetch("/api/admin/org-nodes").then((r) => r.json()).then((d) => setRows(d.data ?? []));
  }
  useEffect(() => {
    load();
    fetch("/api/admin/staff").then((r) => r.json()).then((d) => setStaffList((d.data ?? []).map((s: any) => ({ id: s.id, full_name: s.full_name, role: s.role }))));
  }, []);

  const tree = buildOrgTree(rows, { includeInactive: true });
  const deletedRows = rows.filter((r) => r.deleted_at);

  async function restore(id: string) {
    await fetch("/api/admin/org-nodes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, deleted_at: null }),
    });
    load();
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-3xl text-tuna-yellow mb-2">Kulübümüz — Organizasyon Yönetimi</h1>
        <p className="text-sm text-tuna-mist glass-panel p-4">
          Buradaki ağaç yapısı "Kulübümüz" menüsünde ve otomatik organizasyon şemasında
          birebir görünür. Sınırsız seviyede alt başlık ekleyebilir, sıralamayı ok
          butonlarıyla değiştirebilir, aktif/pasif ve gizli yapabilir, silip geri
          yükleyebilirsiniz.
        </p>
      </div>

      <BaskanMesajiEditor />

      <div className="glass-panel p-6">
        <h2 className="font-semibold mb-3">Yeni Ana Başlık Ekle</h2>
        <NewNodeForm parentId={null} staffList={staffList} onCreated={load} />
      </div>

      <div className="glass-panel p-6">
        <h2 className="font-semibold mb-3">Organizasyon Ağacı (sürükleyerek sırala)</h2>
        <NodeList nodes={tree} staffList={staffList} onChanged={load} depth={0} />
        {!tree.length && <p className="text-tuna-mist text-sm">Henüz bir başlık eklenmedi.</p>}
      </div>

      <div className="glass-panel p-6">
        <button onClick={() => setShowDeleted((v) => !v)} className="font-semibold mb-3 text-left w-full">
          Silinenler ({deletedRows.length}) {showDeleted ? "▾" : "▸"}
        </button>
        {showDeleted && (
          <div className="space-y-2">
            {deletedRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
                <span className="text-tuna-mist">{r.title}</span>
                <button onClick={() => restore(r.id)} className="text-xs text-tuna-gold hover:underline">Geri Yükle</button>
              </div>
            ))}
            {!deletedRows.length && <p className="text-tuna-mist text-sm">Silinmiş öğe yok.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
