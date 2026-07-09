import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "supporter_wall",
  moduleName: "supporter_wall",
  defaultOrder: { column: "created_at", ascending: false },
});
