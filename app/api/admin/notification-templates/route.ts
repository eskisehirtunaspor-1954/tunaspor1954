import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "notification_templates",
  moduleName: "parent_notifications",
  defaultOrder: { column: "updated_at", ascending: false },
});
