import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "teams",
  moduleName: "teams",
  defaultOrder: { column: "category", ascending: false },
});
