import Link from "next/link";
import type { OrgNode } from "@/lib/org-tree";
import { StaffCard } from "@/components/site/StaffCard";

// Native <details>/<summary> tabanlı accordion — ekstra JS gerekmeden erişilebilir,
// sınırsız derinlikte iç içe geçebilir (her "baslik" düğümü kendi <details>'ını açar).
function OrgLeaf({ node, onNavigate }: { node: OrgNode; onNavigate?: () => void }) {
  if (node.node_type === "personel" && node.staff_members) {
    const s = node.staff_members;
    return (
      <div className="max-w-[220px]" onClick={onNavigate}>
        <StaffCard staff={{ ...s, id: s.id || node.staff_id || "" }} />
      </div>
    );
  }
  if (node.node_type === "sayfa_baglantisi" && node.link_href) {
    return (
      <Link href={node.link_href} onClick={onNavigate} className="block py-2 text-sm text-tuna-gold hover:underline">
        {node.title} →
      </Link>
    );
  }
  if (node.node_type === "metin" && node.content) {
    return <p className="py-2 text-sm text-tuna-mist leading-relaxed">{node.content}</p>;
  }
  return <p className="py-2 text-sm text-tuna-mist">{node.title}</p>;
}

export function OrgAccordion({ nodes, depth = 0, onNavigate }: { nodes: OrgNode[]; depth?: number; onNavigate?: () => void }) {
  return (
    <div className={depth > 0 ? "pl-4 border-l border-white/10 ml-2 space-y-1" : "space-y-2"}>
      {nodes.map((node) =>
        node.children.length ? (
          <details key={node.id} className="group glass-panel px-4 py-2" open={depth === 0}>
            <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-sm py-1">
              <span className={depth === 0 ? "text-tuna-gold font-display text-base" : ""}>{node.title}</span>
              <span className="text-tuna-mist text-xs transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-2">
              <OrgAccordion nodes={node.children} depth={depth + 1} onNavigate={onNavigate} />
            </div>
          </details>
        ) : node.node_type === "personel" && node.staff_members ? (
          <div key={node.id}>
            <OrgLeaf node={node} onNavigate={onNavigate} />
          </div>
        ) : (
          <div key={node.id} className={depth === 0 ? "glass-panel px-4" : "px-2"}>
            <OrgLeaf node={node} onNavigate={onNavigate} />
          </div>
        )
      )}
    </div>
  );
}
