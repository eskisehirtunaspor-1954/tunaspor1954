import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "standings",
  moduleName: "standings",
  defaultOrder: { column: "rank", ascending: false },
});
