import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Personel" };

const SOCIAL_KEYS = ["instagram", "twitter", "facebook", "linkedin", "website"] as const;

export default async function PersonelDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: staff } = await supabase
    .from("staff_members")
    .select("*, teams(display_name)")
    .eq("id", params.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!staff) notFound();

  const social = (staff.social_media ?? {}) as Record<string, string>;
  const socialLinks = SOCIAL_KEYS.filter((k) => social[k]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staff.photo_url || "/images/logo.png"}
          alt={staff.full_name}
          className="w-32 h-32 rounded-full object-cover border border-tuna-gold/30 mx-auto md:mx-0 shrink-0"
        />
        <div className="flex-1 text-center md:text-left">
          <p className="eyebrow mb-2">{staff.department || staff.role}</p>
          <h1 className="font-display text-3xl mb-1">{staff.full_name}</h1>
          <p className="text-tuna-mist mb-4">
            {staff.role}
            {staff.teams?.display_name ? ` · ${staff.teams.display_name}` : ""}
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm text-tuna-mist mb-4">
            {staff.uefa_license && <span>🎖️ {staff.uefa_license}</span>}
            {staff.license_info && <span>🪪 Lisans: {staff.license_info}</span>}
            {staff.specialization && <span>🎯 {staff.specialization}</span>}
            {staff.start_date && (
              <span>📅 Göreve Başlama: {new Date(staff.start_date).toLocaleDateString("tr-TR")}</span>
            )}
          </div>

          {staff.resume_pdf_url && (
            <a
              href={staff.resume_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mb-4 text-xs bg-tuna-gold text-tuna-black font-semibold rounded-full px-4 py-2"
            >
              📄 Özgeçmişi PDF Olarak İndir
            </a>
          )}

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {staff.phone && (
              <a href={`tel:${staff.phone.replace(/\s/g, "")}`} className="text-xs text-tuna-gold border border-tuna-gold/30 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10">
                📞 {staff.phone}
              </a>
            )}
            {staff.email && (
              <a href={`mailto:${staff.email}`} className="text-xs text-tuna-gold border border-tuna-gold/30 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10">
                ✉️ {staff.email}
              </a>
            )}
            {socialLinks.map((k) => (
              <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" className="text-xs text-tuna-gold border border-tuna-gold/30 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10 capitalize">
                {k}
              </a>
            ))}
          </div>
        </div>
      </div>

      {staff.description && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Hakkında</h2>
          <p className="text-tuna-mist leading-relaxed">{staff.description}</p>
        </section>
      )}

      {staff.bio && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Özgeçmiş</h2>
          <p className="text-tuna-mist leading-relaxed whitespace-pre-wrap">{staff.bio}</p>
        </section>
      )}

      {staff.teams_coached && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Çalıştırdığı Takımlar</h2>
          <p className="text-tuna-mist leading-relaxed whitespace-pre-wrap">{staff.teams_coached}</p>
        </section>
      )}

      {staff.achievements && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Başarıları</h2>
          <p className="text-tuna-mist leading-relaxed whitespace-pre-wrap">{staff.achievements}</p>
        </section>
      )}

      {staff.video_url && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Video</h2>
          <video src={staff.video_url} controls className="w-full rounded-2xl border border-white/10" />
        </section>
      )}

      {Array.isArray(staff.gallery) && staff.gallery.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl mb-3">Fotoğraf Galerisi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {staff.gallery.map((url: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-xl border border-white/10" loading="lazy" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
