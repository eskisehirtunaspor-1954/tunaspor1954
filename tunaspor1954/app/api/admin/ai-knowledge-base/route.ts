import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "ai_knowledge_base",
  moduleName: "ai_knowledge_base",
  defaultOrder: { column: "updated_at", ascending: false },
});
