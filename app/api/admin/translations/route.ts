import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "translations",
  moduleName: "translations",
  defaultOrder: { column: "namespace", ascending: false },
});
