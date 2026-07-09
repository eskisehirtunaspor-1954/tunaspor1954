import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "training_sessions",
  moduleName: "training_sessions",
  defaultOrder: { column: "session_date", ascending: false },
});
