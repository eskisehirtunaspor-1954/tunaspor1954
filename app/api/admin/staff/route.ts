import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "staff_members",
  moduleName: "staff",
  defaultOrder: { column: "created_at", ascending: false },
});
