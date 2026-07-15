import { createCrudHandlers } from "@/lib/crud-factory";

// Belge dosyasının kendisi mevcut /api/admin/upload (kind=document) üzerinden
// yüklenir; bu route yalnızca metadata + content_summary (yapay zekaya beslenen
// metin) kaydını yönetir — crud-factory'nin standart davranışı burada yeterli.
export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "ai_documents",
  moduleName: "ai_knowledge_base",
  defaultOrder: { column: "created_at", ascending: false },
});
