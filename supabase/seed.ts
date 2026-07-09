import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEAMS = [
  { category: "a_takim", display_name: "A Takım", founded_year: 1954 },
  { category: "kadin_takimi", display_name: "Kadın Takımı", founded_year: 2019 },
  { category: "u18", display_name: "U18 Akademi" },
  { category: "u17", display_name: "U17 Akademi" },
  { category: "u16", display_name: "U16 Akademi" },
  { category: "u15", display_name: "U15 Akademi" },
  { category: "u14", display_name: "U14 Akademi" },
  { category: "u13", display_name: "U13 Akademi" },
  { category: "u12", display_name: "U12 Akademi" },
  { category: "u11", display_name: "U11 Akademi" },
  { category: "u10", display_name: "U10 Akademi" },
  { category: "u9", display_name: "U9 Akademi" },
] as const;

async function main() {
  console.log("Takımlar ekleniyor...");
  for (const team of TEAMS) {
    const { error } = await supabase.from("teams").upsert(team, { onConflict: "category" });
    if (error) console.error(`Hata (${team.category}):`, error.message);
  }

  console.log("AI bilgi tabanı ekleniyor...");
  await supabase.from("ai_knowledge_base").upsert([
    {
      topic: "Kulüp Hakkında",
      content:
        "Tunaspor 1954, Eskişehir'de 1954 yılında kurulmuş köklü bir amatör futbol kulübüdür. A Takım, Kadın Takımı ve U9'dan U18'e kadar akademi kategorileriyle faaliyet gösterir.",
    },
    {
      topic: "Akademiye Kayıt",
      content:
        "Akademiye kayıt için kulübün İletişim sayfasındaki formu doldurabilir veya WhatsApp hattından bize ulaşabilirsiniz. Seçmeler dönemsel olarak Etkinlikler sayfasında duyurulur.",
    },
  ]);

  console.log("Örnek çeviriler ekleniyor (nav namespace)...");
  const navKeys = ["nav_home","nav_about","nav_news","nav_teams","nav_academy","nav_gallery","nav_sponsors","nav_contact","nav_admin"];
  const sampleTranslations = {
    en: ["Home","Club","News","Teams","Academy","Gallery","Sponsors","Contact","Admin Login"],
    de: ["Startseite","Verein","Nachrichten","Mannschaften","Akademie","Galerie","Sponsoren","Kontakt","Admin-Login"],
  };
  for (const [lang, values] of Object.entries(sampleTranslations)) {
    const rows = navKeys.map((key, i) => ({ namespace: "nav", key, lang_code: lang, value: values[i] }));
    await supabase.from("translations").upsert(rows, { onConflict: "namespace,key,lang_code" });
  }

  console.log("Tamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
