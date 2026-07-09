import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "gallery_albums",
  moduleName: "gallery_albums",
  defaultOrder: { column: "created_at", ascending: false },
});
