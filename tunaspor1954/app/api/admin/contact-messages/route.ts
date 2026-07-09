import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "contact_messages",
  moduleName: "contact_messages",
  defaultOrder: { column: "created_at", ascending: false },
});
