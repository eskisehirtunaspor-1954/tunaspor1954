import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "jersey_designs",
  moduleName: "jersey_designs",
  defaultOrder: { column: "created_at", ascending: false },
});
