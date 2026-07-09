"use client";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

export default function Page() {
  return (
    <GenericCrudManager
      apiPath="/api/admin/orders"
      title="Siparişler"
      titleField="customer_name"
      subtitleField="total_amount"
      fields={[
        { name: "customer_name", label: "Müşteri" },
        { name: "phone", label: "Telefon" },
        { name: "address", label: "Adres", type: "textarea" },
        { name: "total_amount", label: "Toplam (₺)", type: "number" },
        { name: "payment_method", label: "Ödeme Şekli", type: "select",
          options: [
            { value: "havale", label: "Havale/EFT" },
            { value: "kapida_odeme", label: "Kapıda Ödeme" },
          ] },
        { name: "status", label: "Durum", type: "select", required: true,
          options: [
            { value: "beklemede", label: "Beklemede" },
            { value: "onaylandi", label: "Onaylandı" },
            { value: "kargoda", label: "Kargoda" },
            { value: "teslim_edildi", label: "Teslim Edildi" },
            { value: "iptal", label: "İptal" },
          ] },
      ]}
    />
  );
}
