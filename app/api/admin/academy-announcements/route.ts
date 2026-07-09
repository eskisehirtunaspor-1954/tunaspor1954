import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "academy_announcements",
  moduleName: "academy_announcements",
  defaultOrder: { column: "created_at", ascending: false },
});
