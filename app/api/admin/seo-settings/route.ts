import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "seo_settings",
  moduleName: "seo_settings",
  defaultOrder: { column: "page_path", ascending: false },
});
