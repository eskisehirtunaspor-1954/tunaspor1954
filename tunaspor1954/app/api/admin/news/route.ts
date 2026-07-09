import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "news",
  moduleName: "news",
  defaultOrder: { column: "published_at", ascending: false },
});
