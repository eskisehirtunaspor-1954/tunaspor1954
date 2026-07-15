export interface OrgNodeRow {
  id: string;
  parent_id: string | null;
  title: string;
  node_type: "baslik" | "personel" | "sayfa_baglantisi" | "metin";
  staff_id: string | null;
  link_href: string | null;
  content: string | null;
  display_order: number;
  is_active: boolean;
  is_hidden: boolean;
  deleted_at: string | null;
  staff_members?: { full_name: string; role: string; photo_url: string | null } | null;
}

export interface OrgNode extends OrgNodeRow {
  children: OrgNode[];
}

// Düz (parent_id ile birbirine bağlı) satır listesinden sınırsız derinlikte
// bir ağaç kurar. Admin panelinde pasif/gizli düğümler de görünsün diye
// includeInactive seçeneği vardır; herkese açık sayfa bunu false bırakır.
export function buildOrgTree(rows: OrgNodeRow[], { includeInactive = false }: { includeInactive?: boolean } = {}): OrgNode[] {
  const visible = rows.filter((r) => !r.deleted_at && (includeInactive || (r.is_active && !r.is_hidden)));
  const byId = new Map<string, OrgNode>();
  visible.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: OrgNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes: OrgNode[]) => {
    nodes.sort((a, b) => a.display_order - b.display_order);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}
