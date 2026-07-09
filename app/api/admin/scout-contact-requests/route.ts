import { createCrudHandlers } from "@/lib/crud-factory";

// Sadece görüntüleme/silme amaçlı — admin bu talepleri görüp kulüple manuel iletişime geçer
export const { GET, POST, PATCH, DELETE } = createCrudHandlers({
  table: "scout_contact_requests",
  moduleName: "scout_contact_requests",
  defaultOrder: { column: "created_at", ascending: false },
});
