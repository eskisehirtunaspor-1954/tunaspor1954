import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "events",
  moduleName: "events",
  defaultOrder: { column: "start_date", ascending: false },
});
