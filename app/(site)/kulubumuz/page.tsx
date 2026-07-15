import { createClient } from "@/lib/supabase/server";
import { buildOrgTree, type OrgNodeRow } from "@/lib/org-tree";
import { OrgAccordion } from "@/components/site/OrgAccordion";
import { OrgChart } from "@/components/site/OrgChart";

export const metadata = { title: "Kulübümüz" };

export default async function KulubumuzPage() {
  const supabase = createClient();

  const [{ data: baskan }, { data: nodeRows }] = await Promise.all([
    supabase.from("baskan_mesaji").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("org_nodes")
      .select("*, staff_members(id, full_name, role, photo_url, uefa_license, specialization, start_date, bio, phone, email, social_media)")
      .order("display_order"),
  ]);

  const tree = buildOrgTree((nodeRows ?? []) as unknown as OrgNodeRow[]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-16">
      <div>
        <p className="eyebrow mb-3">KULÜBÜMÜZ</p>
        <h1 className="font-display text-4xl mb-8">Tunaspor 1954'ün Hikayesi</h1>
      </div>

      {baskan?.message && (
        <section id="baskan-mesaji" className="glass-panel p-6 md:p-8 scroll-mt-28">
          <p className="eyebrow mb-4">Başkanın Mesajı</p>
          <div className="flex flex-col md:flex-row gap-6">
            {baskan.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={baskan.photo_url} alt={baskan.name ?? ""} className="w-24 h-24 rounded-full object-cover border border-tuna-gold/30 shrink-0" />
            )}
            <div>
              <p className="font-display text-xl text-tuna-gold">{baskan.name}</p>
              {baskan.title && <p className="text-sm text-tuna-mist mb-3">{baskan.title}</p>}
              <p className="text-tuna-mist leading-relaxed whitespace-pre-wrap">{baskan.message}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                {baskan.video_url && (
                  <a href={baskan.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-tuna-gold border border-tuna-gold/40 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10">
                    🎥 Video Mesajı İzle
                  </a>
                )}
                {baskan.pdf_url && (
                  <a href={baskan.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-tuna-gold border border-tuna-gold/40 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10">
                    📄 PDF Olarak Oku
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!baskan?.message && <span id="baskan-mesaji" className="block scroll-mt-28" />}

      <section id="tarihce" className="scroll-mt-28">
        <h2 className="font-display text-2xl mb-6">Tarihçemiz</h2>
        <p className="text-tuna-mist leading-relaxed">
          Tunaspor 1954, Eskişehir'in en köklü amatör spor kulüplerinden biri
          olarak, kuruluşundan bu yana şehrin futbol kültürüne emek vermeye
          devam ediyor. Kulübümüz yalnızca bir A Takım'dan ibaret değil; Kız
          Takımı ve U10'dan U18'e uzanan akademi yapısıyla yüzlerce genç
          sporcuya sahada disiplin, takım ruhu ve aidiyet duygusu
          kazandırıyor.
        </p>
      </section>

      <section id="misyon-vizyon" className="scroll-mt-28">
        <h2 className="font-display text-2xl mb-6">Misyon & Vizyon</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <p className="eyebrow mb-2">Misyonumuz</p>
            <p className="text-tuna-mist leading-relaxed">
              Eskişehir'in yerel yeteneklerini keşfedip geliştirmek, onları
              hem sportif hem de kişisel gelişim açısından desteklemek ve
              Tunaspor formasını taşıyan her sporcuyu kulübün değerleriyle
              yetiştirmektir.
            </p>
          </div>
          <div className="glass-panel p-6">
            <p className="eyebrow mb-2">Vizyonumuz</p>
            <p className="text-tuna-mist leading-relaxed">
              Eskişehir'in ve bölgenin en çok güvenilen, alt yapısıyla öne
              çıkan, şehrin futbol kültürünü ulusal düzeyde temsil eden bir
              kulüp olmaktır.
            </p>
          </div>
        </div>
      </section>

      <section id="tesisler" className="scroll-mt-28">
        <h2 className="font-display text-2xl mb-6">Tesislerimiz</h2>
        <p className="text-tuna-mist leading-relaxed">
          Ediz Bahtiyaroğlu Sahası başta olmak üzere kulübümüze bağlı
          antrenman sahaları, A Takım ve akademi kategorilerinin haftalık
          çalışma programlarını sürdürdüğü tesislerdir.
        </p>
      </section>

      {tree.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-6">Organizasyon Yapımız</h2>
          <OrgAccordion nodes={tree} />
        </section>
      )}

      {tree.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-6">Organizasyon Şeması</h2>
          <OrgChart nodes={tree} />
        </section>
      )}
    </div>
  );
}
