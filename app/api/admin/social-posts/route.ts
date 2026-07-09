import { createCrudHandlers } from "@/lib/crud-factory";

export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "social_posts",
  moduleName: "social_posts",
  defaultOrder: { column: "sort_order", ascending: false },
});
