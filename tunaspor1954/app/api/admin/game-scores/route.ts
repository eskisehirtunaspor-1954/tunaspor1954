import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "game_scores",
  moduleName: "game_scores",
  defaultOrder: { column: "score", ascending: false },
});
