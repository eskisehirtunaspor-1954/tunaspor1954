import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "fixtures",
  moduleName: "fixtures",
  defaultOrder: { column: "match_date", ascending: false },
});
