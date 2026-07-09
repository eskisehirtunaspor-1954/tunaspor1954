import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "orders",
  moduleName: "orders",
  defaultOrder: { column: "created_at", ascending: false },
});
