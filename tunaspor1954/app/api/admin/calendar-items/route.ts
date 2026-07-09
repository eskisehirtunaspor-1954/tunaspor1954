import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "calendar_items",
  moduleName: "calendar_items",
  defaultOrder: { column: "start_time", ascending: false },
});
