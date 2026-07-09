import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/home/ContactForm";
import { T } from "@/components/layout/T";

export const metadata = { title: "İletişim" };

export default async function IletisimPage() {
  const supabase = createClient();
  const { data: info } = await supabase.from("contact_info").select("*").eq("id", 1).single();

  const whatsappNumber = info?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12">
      <div>
        <T k="page_contact_eyebrow" as="p" className="eyebrow mb-3" />
        <T k="page_contact_title" as="h1" className="font-display text-4xl mb-6" />
        <ul className="space-y-3 text-tuna-mist mb-8">
          {info?.address && <li>📍 {info.address}</li>}
          {info?.phone && <li>📞 {info.phone}</li>}
          {info?.email && <li>✉️ {info.email}</li>}
        </ul>
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
        {info?.map_lat && info?.map_lng && (
          <div className="mt-8 rounded-2xl overflow-hidden aspect-video">
            <iframe
              className="w-full h-full"
              loading="lazy"
              src={`https://www.google.com/maps?q=${info.map_lat},${info.map_lng}&output=embed`}
            />
          </div>
        )}
      </div>
      <ContactForm />
    </div>
  );
}
