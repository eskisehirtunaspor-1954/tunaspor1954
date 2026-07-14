import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/home/ContactForm";
import { T } from "@/components/layout/T";

// Leaflet window nesnesine ihtiyaç duyar — yalnızca istemci tarafında render edilir.
const ClubMap = dynamic(() => import("@/components/site/ClubMap").then((m) => m.ClubMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

export const metadata = { title: "İletişim" };

export default async function IletisimPage() {
  const supabase = createClient();
  const { data: info } = await supabase.from("contact_info").select("*").eq("id", 1).single();

  const whatsappNumber = info?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // Harita hedefi: koordinat girilmişse en hassas sonucu verir, yoksa adres
  // metniyle arama yapılır.
  const hasCoords = Boolean(info?.map_lat && info?.map_lng);
  const mapQuery = hasCoords ? `${info.map_lat},${info.map_lng}` : info?.address;
  // Bu standart Google Maps URL şeması mobil cihazlarda otomatik olarak Google Maps
  // uygulamasına yönlenir (iOS/Android universal link) — ayrı user-agent algılaması gerekmez.
  const directionsHref = mapQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}` : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12">
      <div>
        <T k="page_contact_eyebrow" as="p" className="eyebrow mb-3" />
        <T k="page_contact_title" as="h1" className="font-display text-4xl mb-6" />
        <ul className="space-y-3 text-tuna-mist mb-8">
          {info?.address && <li>📍 {info.address}</li>}
          {info?.contact_person && <li>👤 {info.contact_person}</li>}
          {info?.phone && <li>📞 {info.phone}</li>}
          {info?.email && <li>✉️ {info.email}</li>}
        </ul>
        <div className="flex flex-wrap gap-3">
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-tuna-yellow text-tuna-black font-semibold px-6 py-3 rounded-full"
            >
              WhatsApp'tan Yaz
            </a>
          )}
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-tuna-gold/40 text-tuna-gold font-semibold px-6 py-3 rounded-full hover:bg-tuna-gold/10 hover:border-tuna-gold transition-colors"
            >
              🧭 Yol Tarifi Al
            </a>
          )}
        </div>
        {hasCoords && (
          <div className="mt-8 aspect-video w-full overflow-hidden rounded-2xl">
            <ClubMap
              lat={Number(info.map_lat)}
              lng={Number(info.map_lng)}
              name={info?.location_name || "Tunaspor 1954 Kulüp Binası"}
              address={info?.address}
              variant="club"
            />
          </div>
        )}
      </div>
      <ContactForm />
    </div>
  );
}
