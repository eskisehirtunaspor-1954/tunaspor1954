import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "videos",
  moduleName: "videos",
  defaultOrder: { column: "published_at", ascending: false },
});
