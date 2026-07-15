import type { OrgNode } from "@/lib/org-tree";

// Yönetici panelindeki organizasyon ağacından otomatik türetilen, bağlantı
// çizgili basit bir şema — yeni bir görev eklendiğinde kod değişmeden burada
// da otomatik görünür (aynı org_nodes verisi kullanılır).
function ChartNode({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass-panel border border-tuna-gold/30 px-4 py-2 text-center text-sm whitespace-nowrap">
        {node.title}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="w-px h-5 bg-tuna-gold/30" />
          <div className="flex items-start gap-6 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-px bg-tuna-gold/30" style={{ marginTop: 0 }} />
            )}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center pt-5">
                <ChartNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrgChart({ nodes }: { nodes: OrgNode[] }) {
  if (!nodes.length) return null;
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-10 min-w-max px-4">
        {nodes.map((node) => (
          <ChartNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
