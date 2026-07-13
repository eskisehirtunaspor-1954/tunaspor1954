import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/home/ContactForm";
import { T } from "@/components/layout/T";

export const metadata = { title: "İletişim" };

export default async function IletisimPage() {
  const supabase = createClient();
  const { data: info } = await supabase.from("contact_info").select("*").eq("id", 1).single();

  const whatsappNumber = info?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // Harita hedefi: koordinat girilmişse en hassas sonucu verir, yoksa adres
  // metniyle arama yapılır — ikisi de aynı embed/yön tarifi URL şemasını kullanır.
  const hasCoords = Boolean(info?.map_lat && info?.map_lng);
  const mapQuery = hasCoords ? `${info.map_lat},${info.map_lng}` : info?.address;
  const mapsEmbedSrc = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
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
        {mapsEmbedSrc && (
          <div className="mt-8 rounded-2xl overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapsEmbedSrc}
            />
          </div>
        )}
      </div>
      <ContactForm />
    </div>
  );
}
