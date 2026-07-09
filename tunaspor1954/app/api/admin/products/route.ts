import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "products",
  moduleName: "products",
  defaultOrder: { column: "category", ascending: true },
});
