import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "ai_faqs",
  moduleName: "ai_knowledge_base",
  defaultOrder: { column: "created_at", ascending: false },
});
