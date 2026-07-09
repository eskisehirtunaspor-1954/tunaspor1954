import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "event_registrations",
  moduleName: "event_registrations",
  defaultOrder: { column: "created_at", ascending: false },
});
