import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "languages",
  moduleName: "languages",
  defaultOrder: { column: "code", ascending: false },
});
