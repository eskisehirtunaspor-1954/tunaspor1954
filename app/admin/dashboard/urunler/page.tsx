"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/products"
      title="Mağaza Ürünleri"
      titleField="name"
      subtitleField="price"
      fields={[
        { name: "name", label: "Ürün Adı", required: true },
        { name: "category", label: "Kategori", type: "select", required: true,
          options: [
            { value: "forma", label: "Forma" },
            { value: "atki", label: "Atkı" },
            { value: "tisort", label: "Tişört" },
          ] },
        { name: "price", label: "Fiyat (₺)", type: "number", required: true },
        { name: "image_url", label: "Görsel", type: "image", folder: "products" },
        { name: "stock", label: "Stok Adedi", type: "number", required: true },
        { name: "is_published", label: "Yayınla", type: "checkbox" },
      ]}
    />
  );
}
