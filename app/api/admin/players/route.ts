import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "players",
  moduleName: "players",
  defaultOrder: { column: "created_at", ascending: false },
});
