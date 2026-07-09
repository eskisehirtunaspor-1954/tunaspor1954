import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// "TUNA AI" — Tunaspor 1954'ün kendi yapay zeka asistanı. Sadece statik bilgi
// tabanından okumakla kalmaz; gerektiğinde canlı verilere (son maç sonucu gibi)
// gerçek zamanlı erişmek için Anthropic'in tool-use (fonksiyon çağırma) özelliğini kullanır.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

// ---- TUNA AI'nin çağırabileceği araçlar (tool-use) ----
// Bu araçlar, sohbet sırasında ihtiyaç duyulduğunda gerçek veritabanı sorgusu
// çalıştırır — böylece "son maç kaç kaç bitti?" gibi anlık sorulara ezberlenmiş
// değil, gerçek ve güncel bir yanıt verilir.
const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_last_match_result",
    description:
      "Tunaspor 1954 A Takımı'nın oynanmış (bitmiş) en son maçının sonucunu, rakibini ve tarihini döner. Kullanıcı 'son maç kaç kaç bitti', 'son maçı kazandık mı' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_next_match",
    description:
      "Tunaspor 1954'ün sıradaki (henüz oynanmamış) maçının tarihini, saatini, rakibini ve stadyumunu döner. Kullanıcı 'sıradaki maç ne zaman', 'bu hafta maçımız var mı' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_camp_or_event_schedule",
    description:
      "Yaz futbol okulu, seçmeler, turnuva veya seminer gibi yaklaşan etkinliklerin tarih ve kayıt durumunu döner. Kullanıcı 'yaz futbol okulu ne zaman', 'seçmeler ne zaman' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: {
      type: "object",
      properties: {
        event_type: {
          type: "string",
          enum: ["yaz_kampi", "secme", "turnuva", "seminer", "etkinlik", "hepsi"],
          description: "Sorulan etkinlik türü, emin değilsen 'hepsi' kullan.",
        },
      },
    },
  },
  {
    name: "get_league_standing",
    description:
      "Tunaspor 1954'ün oynadığı ligdeki güncel puan durumundaki sırasını, puanını ve maç istatistiklerini döner. Kullanıcı 'ligde kaçıncısınız', 'puan durumu nedir' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: { type: "object", properties: {} },
  },
];

async function executeTool(name: string, input: any): Promise<string> {
  const supabase = createServiceClient();

  if (name === "get_last_match_result") {
    const { data } = await supabase
      .from("fixtures")
      .select("*")
      .eq("status", "finished")
      .order("match_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return "Henüz kaydedilmiş bir maç sonucu bulunmuyor.";
    const home = data.home_or_away === "home" ? "Tunaspor 1954" : data.opponent;
    const away = data.home_or_away === "home" ? data.opponent : "Tunaspor 1954";
    return `${new Date(data.match_date).toLocaleDateString("tr-TR")} tarihinde oynanan maç: ${home} ${data.home_score ?? "?"} - ${data.away_score ?? "?"} ${away}. Yarışma: ${data.competition ?? "belirtilmedi"}.`;
  }

  if (name === "get_next_match") {
    const { data } = await supabase
      .from("fixtures")
      .select("*")
      .gte("match_date", new Date().toISOString())
      .order("match_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!data) return "Şu anda planlanmış yaklaşan bir maç bulunmuyor.";
    const home = data.home_or_away === "home" ? "Tunaspor 1954" : data.opponent;
    const away = data.home_or_away === "home" ? data.opponent : "Tunaspor 1954";
    return `Sıradaki maç: ${home} - ${away}, ${new Date(data.match_date).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}${data.venue ? `, ${data.venue}` : ""}.`;
  }

  if (name === "get_camp_or_event_schedule") {
    let query = supabase.from("events").select("*").gte("start_date", new Date().toISOString()).order("start_date");
    if (input?.event_type && input.event_type !== "hepsi") query = query.eq("type", input.event_type);
    const { data } = await query.limit(5);
    if (!data?.length) return "Şu anda bu türde planlanmış, yaklaşan bir etkinlik bulunmuyor. Yeni duyurular için Etkinlikler sayfasını takip etmesini öner.";
    return data
      .map((e) => `${e.title} — ${new Date(e.start_date).toLocaleDateString("tr-TR")}${e.location ? `, ${e.location}` : ""}. Kayıt durumu: ${e.registration_open ? "açık (web sitesindeki Etkinlikler sayfasından başvurulabilir)" : "henüz açılmadı"}.`)
      .join("\n");
  }

  if (name === "get_league_standing") {
    const { data } = await supabase.from("league_table_rows").select("*").eq("is_own_team", true).maybeSingle();
    if (!data) return "Güncel puan durumu bilgisi henüz girilmemiş.";
    return `${data.league_name} (${data.season}) içinde Tunaspor 1954 şu an ${data.rank}. sırada: ${data.played} maç, ${data.won} galibiyet, ${data.drawn} beraberlik, ${data.lost} mağlubiyet, ${data.points} puan.`;
  }

  return "Bilinmeyen araç.";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createClient();

  const { data: knowledge } = await supabase
    .from("ai_knowledge_base")
    .select("topic, content")
    .eq("is_active", true);

  const { data: contactInfo } = await supabase
    .from("contact_info")
    .select("address, phone, whatsapp_number, email, instagram_url, facebook_url, youtube_url")
    .eq("id", 1)
    .single();

  const knowledgeText = (knowledge ?? [])
    .map((k) => `## ${k.topic}\n${k.content}`)
    .join("\n\n");

  const contactText = contactInfo
    ? `## Güncel İletişim Bilgileri\nAdres: ${contactInfo.address ?? "belirtilmedi"}\nTelefon: ${contactInfo.phone ?? "belirtilmedi"}\nWhatsApp: ${contactInfo.whatsapp_number ?? "belirtilmedi"}\nE-posta: ${contactInfo.email ?? "belirtilmedi"}\nInstagram: ${contactInfo.instagram_url ?? "-"}`
    : "";

  // Değişmeyen, her zaman doğru sabit bilgiler — tool'a gerek kalmadan direkt yanıtlanabilir.
  const staticFactsText = `## Akademi Yaş Kategorileri (sabit bilgi)
Tunaspor 1954 Akademi, U9'dan U18'e kadar 10 yaş kategorisinde faaliyet gösterir: U9, U10, U11, U12, U13, U14, U15, U16, U17, U18. Ayrıca A Takım (yetişkin) ve Kadın Takımı bulunur. Akademiye kayıt için doğum yılına göre uygun kategoriye yönlendir; kesin kayıt/seçme tarihleri için get_camp_or_event_schedule aracını kullan.`;

  const systemPrompt = `Sen "TUNA AI" — Tunaspor 1954 futbol kulübünün kendi yapay zeka asistanısın. Sadece önceden yazılmış cevapları tekrarlayan basit bir chatbot değilsin; gerektiğinde elindeki araçları kullanarak gerçek zamanlı, güncel ve doğru yanıtlar üretirsin. Varsayılan olarak Türkçe yanıt ver; kullanıcı başka bir dilde yazarsa o dilde devam et. Kısa, samimi ve doğru ol.

Görevlerin ve nasıl davranman gerektiği:
1. "Son maç kaç kaç bitti", "ligde kaçıncıyız", "sıradaki maç ne zaman" gibi CANLI/GÜNCEL veri gerektiren sorularda MUTLAKA ilgili aracı çağır, tahmin veya ezber bilgiyle cevap verme.
2. "Yaz futbol okulu ne zaman", "seçmeler ne zaman" gibi sorularda get_camp_or_event_schedule aracını kullan.
3. Akademi yaş kategorileri, kulüp tarihçesi gibi sabit bilgileri aşağıdaki metinlerden yanıtla.
4. Kayıt/başvuru sürecini soranlara: ilgili etkinlik açık kayıt alıyorsa web sitesindeki "Etkinlikler" sayfasından online başvurabileceklerini söyle; değilse WhatsApp'tan iletişime geçmelerini öner.
5. İletişim bilgisi isteyenlere güncel bilgileri doğrudan ve eksiksiz paylaş.
6. Forma fiyatı, ürün fiyatları gibi bilgi tabanında (aşağıda) yer almayan KULÜBE ÖZEL konularda asla bilgi uydurma — kulübün WhatsApp hattına yönlendir.
7. Kulüple ilgisi olmayan genel konularda (futbol dünyası, spor, eğitim, teknoloji, günlük hayat, tarih, bilim, genel kültür vb.) rahatça ve doğal şekilde sohbet edebilirsin — bunlar için araç kullanmana gerek yok, kendi genel bilgini kullan. Sadece kulüple ilgili GÜNCEL/canlı verilerde (madde 1) araç zorunlu.
8. Emin olmadığın hiçbir konuda, özellikle kulübe özel konularda, bilgi uydurma.

${staticFactsText}

${knowledgeText}

${contactText}`;

  const userMessages: Anthropic.MessageParam[] = body.messages
    .slice(-10)
    .map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content).slice(0, 2000),
    }));

  try {
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemPrompt,
      tools: TOOLS,
      messages: userMessages,
    });

    // Tool-use döngüsü: model bir veya daha fazla araç çağırmak isteyebilir.
    // Sonucu ekleyip modele geri gönderiyoruz, o da nihai metni üretiyor.
    let loopGuard = 0;
    const conversationMessages = [...userMessages];

    while (response.stop_reason === "tool_use" && loopGuard < 3) {
      loopGuard += 1;
      conversationMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(block.name, block.input);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      conversationMessages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: systemPrompt,
        tools: TOOLS,
        messages: conversationMessages,
      });
    }

    const reply = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");

    return NextResponse.json({ reply: reply || "Bu konuda şu an net bir bilgim yok, WhatsApp üzerinden kulübe ulaşabilirsin." });
  } catch (err) {
    console.error("TUNA AI hatası:", err);
    return NextResponse.json(
      { reply: "Şu anda yanıt veremiyorum. Lütfen WhatsApp üzerinden bize ulaşın." },
      { status: 200 }
    );
  }
}
