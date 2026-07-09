import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "training_attendance",
  moduleName: "training_attendance",
  defaultOrder: { column: "created_at", ascending: false },
});
