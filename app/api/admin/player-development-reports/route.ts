import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "player_development_reports",
  moduleName: "player_development_reports",
  defaultOrder: { column: "created_at", ascending: false },
});
