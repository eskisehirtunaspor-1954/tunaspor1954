import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "gallery_photos",
  moduleName: "gallery_photos",
  defaultOrder: { column: "sort_order", ascending: false },
});
