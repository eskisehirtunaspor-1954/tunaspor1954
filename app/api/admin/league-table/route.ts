import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "league_table_rows",
  moduleName: "league_table_rows",
  defaultOrder: { column: "rank", ascending: true },
});
