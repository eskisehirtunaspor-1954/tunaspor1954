import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "player_fees",
  moduleName: "player_fees",
  defaultOrder: { column: "due_date", ascending: false },
});
