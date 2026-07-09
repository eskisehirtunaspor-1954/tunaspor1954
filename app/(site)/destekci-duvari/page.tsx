import { createClient } from "@/lib/supabase/server";
import { SupporterWallForm } from "@/components/home/SupporterWallForm";
import { T } from "@/components/layout/T";

export const metadata = { title: "Destekçi Duvarı" };

export default async function DestekciDuvariPage() {
  const supabase = createClient();
  const { data: messages } = await supabase
    .from("supporter_wall")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <T k="page_supporterwall_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_supporterwall_title" as="h1" className="font-display text-4xl mb-6" />
      <p className="text-tuna-mist mb-12 max-w-2xl">
        Tunaspor 1954'e desteğini göstermek isteyen herkes bu duvara bir mesaj
        bırakabilir. Mesajlar yayınlanmadan önce yönetici onayından geçer.
      </p>

      <SupporterWallForm />

      <div className="grid md:grid-cols-3 gap-4 mt-12">
        {(messages ?? []).map((m) => (
          <div key={m.id} className="glass-panel p-5">
            {m.supporter_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.supporter_logo_url} alt={m.supporter_name} className="h-10 mb-3 object-contain" />
            )}
            <p className="text-sm text-tuna-mist mb-2">"{m.message}"</p>
            <p className="text-xs text-tuna-yellow font-semibold">— {m.supporter_name}</p>
          </div>
        ))}
        {!messages?.length && (
          <p className="text-tuna-mist col-span-full text-center">Henüz onaylanmış mesaj yok.</p>
        )}
      </div>
    </div>
  );
}
