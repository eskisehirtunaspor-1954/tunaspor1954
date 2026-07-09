import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "sponsors",
  moduleName: "sponsors",
  defaultOrder: { column: "sort_order", ascending: false },
});
