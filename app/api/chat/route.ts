import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Golden Wolf emin olmadığında TAM OLARAK bu metni döndürmesi için talimatlandırılır
// (bkz. systemPrompt madde 14) — client bu metni değil, response'taki needsHuman
// bayrağını kullanarak WhatsApp/İletişim Formu butonlarını gösterir.
// NOT: Next.js route dosyaları yalnızca izin verilen adları (GET/POST/config vb.)
// export edebilir, bu yüzden bu sabit dışa aktarılmıyor.
const UNSURE_FALLBACK_MESSAGE =
  "Kulübümüz adına en doğru bilgiyi verebilmemiz için sizi WhatsApp destek hattımıza yönlendirebilirim.";

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
  {
    name: "get_team_roster",
    description:
      "Belirli bir takım/yaş kategorisinin antrenörünü, açıklamasını ve oyuncu kadrosunu (isim, mevki, forma numarası) döner. Kullanıcı 'A takımda kimler var', 'kadın takımının antrenörü kim', 'U14 kadrosu' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["a_takim", "kadin_takimi", "u18", "u17", "u16", "u15", "u14", "u13", "u12", "u11", "u10", "u9"],
          description: "Sorulan takım/yaş kategorisi.",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "get_staff_list",
    description:
      "Kulübün yönetim ve teknik ekibindeki kişileri (başkan, teknik direktör, antrenörler, kondisyoner vb.) ve görevlerini döner. Kullanıcı 'yönetim kurulu kim', 'teknik ekipte kimler var', 'başkan kim' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_latest_news",
    description:
      "Kulüple ilgili en güncel yayınlanmış haberleri (başlık, özet, tarih) döner. Kullanıcı 'son haberler neler', 'yeni bir haber var mı' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_training_schedule",
    description:
      "Belirli bir takımın/kategorinin (veya tüm takımların) yaklaşan planlı antrenman gün ve saatlerini döner. Kullanıcı 'antrenmanlar ne zaman', 'U12 ne zaman antrenmana çıkıyor' gibi bir şey sorduğunda bu aracı kullan.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["a_takim", "kadin_takimi", "u18", "u17", "u16", "u15", "u14", "u13", "u12", "u11", "u10", "u9", "hepsi"],
          description: "Sorulan takım/yaş kategorisi, emin değilsen 'hepsi' kullan.",
        },
      },
    },
  },
  // Anthropic'in kendi barındırdığı, gerçek zamanlı internet araması yapan
  // sunucu aracı — ayrı bir API anahtarı gerekmez, aynı Anthropic hesabına
  // faturalanır. Yalnızca model gerçekten gerekli gördüğünde (güncel/genel
  // konularda) çağrılır; kulüple ilgili sorularda kullanılmaz (madde 1-6 zaten
  // veritabanı araçlarını zorunlu kılıyor).
  { type: "web_search_20250305", name: "web_search", max_uses: 3 } as unknown as Anthropic.Tool,
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
      .map((e: any) => `${e.title} — ${new Date(e.start_date).toLocaleDateString("tr-TR")}${e.location ? `, ${e.location}` : ""}. Kayıt durumu: ${e.registration_open ? "açık (web sitesindeki Etkinlikler sayfasından başvurulabilir)" : "henüz açılmadı"}.`)
      .join("\n");
  }

  if (name === "get_league_standing") {
    const { data } = await supabase.from("league_table_rows").select("*").eq("is_own_team", true).maybeSingle();
    if (!data) return "Güncel puan durumu bilgisi henüz girilmemiş.";
    return `${data.league_name} (${data.season}) içinde Tunaspor 1954 şu an ${data.rank}. sırada: ${data.played} maç, ${data.won} galibiyet, ${data.drawn} beraberlik, ${data.lost} mağlubiyet, ${data.points} puan.`;
  }

  if (name === "get_team_roster") {
    const category = input?.category;
    if (!category) return "Hangi takım/kategoriyi kastettiğinizi belirtir misiniz? (Örn: A Takım, Kadın Takımı, U14)";
    const { data: team } = await supabase.from("teams").select("*").eq("category", category).eq("is_published", true).maybeSingle();
    if (!team) return "Bu kategoriye ait yayınlanmış bir takım bilgisi bulunamadı.";
    const { data: players } = await supabase
      .from("players")
      .select("full_name, position, jersey_number")
      .eq("team_id", team.id)
      .eq("is_published", true)
      .order("jersey_number", { ascending: true })
      .limit(30);
    const roster = (players ?? [])
      .map((p: any) => `#${p.jersey_number ?? "-"} ${p.full_name}${p.position ? ` (${p.position})` : ""}`)
      .join(", ");
    return `${team.display_name}${team.coach_name ? ` — Antrenör: ${team.coach_name}` : ""}.${team.description ? ` ${team.description}` : ""} Kadro: ${roster || "henüz oyuncu listesi girilmemiş"}.`;
  }

  if (name === "get_staff_list") {
    const { data } = await supabase.from("staff_members").select("full_name, role").eq("is_published", true).limit(40);
    if (!data?.length) return "Yönetim/teknik ekip bilgisi henüz girilmemiş.";
    return data.map((s: any) => `${s.full_name} — ${s.role}`).join("\n");
  }

  if (name === "get_latest_news") {
    const { data } = await supabase
      .from("news")
      .select("title, excerpt, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5);
    if (!data?.length) return "Henüz yayınlanmış bir haber bulunmuyor.";
    return data
      .map((n: any) => `${n.title}${n.published_at ? ` (${new Date(n.published_at).toLocaleDateString("tr-TR")})` : ""}${n.excerpt ? ` — ${n.excerpt}` : ""}`)
      .join("\n");
  }

  if (name === "get_training_schedule") {
    let query = supabase
      .from("training_sessions")
      .select("*, teams(display_name)")
      .gte("session_date", new Date().toISOString().slice(0, 10))
      .eq("status", "scheduled")
      .order("session_date", { ascending: true });
    if (input?.category && input.category !== "hepsi") {
      const { data: team } = await supabase.from("teams").select("id").eq("category", input.category).maybeSingle();
      if (team) query = query.eq("team_id", team.id);
    }
    const { data } = await query.limit(8);
    if (!data?.length) return "Yaklaşan planlı bir antrenman bulunmuyor.";
    return data
      .map((s: any) => `${s.teams?.display_name ?? "Takım"} — ${new Date(s.session_date).toLocaleDateString("tr-TR")} ${s.start_time}${s.end_time ? `-${s.end_time}` : ""}${s.venue ? `, ${s.venue}` : ""}`)
      .join("\n");
  }

  return "Bilinmeyen araç.";
}

interface Attachment {
  mediaType: string;
  base64: string;
  kind: "image" | "document";
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

  const [{ data: knowledge }, { data: contactInfo }, { data: settings }, { data: faqs }, { data: documents }] = await Promise.all([
    supabase.from("ai_knowledge_base").select("topic, content").eq("is_active", true),
    supabase.from("contact_info").select("address, phone, whatsapp_number, email, instagram_url, facebook_url, youtube_url").eq("id", 1).single(),
    supabase.from("ai_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("ai_faqs").select("question, answer").eq("is_active", true),
    supabase.from("ai_documents").select("title, content_summary").eq("is_active", true).not("content_summary", "is", null),
  ]);

  const assistantName = settings?.assistant_name || "Golden Wolf";

  const knowledgeText = (knowledge ?? [])
    .map((k: any) => `## ${k.topic}\n${k.content}`)
    .join("\n\n");

  const faqText = (faqs ?? []).length
    ? `## Sıkça Sorulan Sorular\n${(faqs ?? []).map((f: any) => `S: ${f.question}\nC: ${f.answer}`).join("\n\n")}`
    : "";

  const documentsText = (documents ?? []).length
    ? `## Yüklenmiş Belgeler (özet)\n${(documents ?? []).map((d: any) => `### ${d.title}\n${d.content_summary}`).join("\n\n")}`
    : "";

  const contactText = contactInfo
    ? `## Güncel İletişim Bilgileri\nAdres: ${contactInfo.address ?? "belirtilmedi"}\nTelefon: ${contactInfo.phone ?? "belirtilmedi"}\nWhatsApp: ${contactInfo.whatsapp_number ?? "belirtilmedi"}\nE-posta: ${contactInfo.email ?? "belirtilmedi"}\nInstagram: ${contactInfo.instagram_url ?? "-"}`
    : "";

  const staticFactsText = `## Akademi Yaş Kategorileri (sabit bilgi)
Tunaspor 1954 Akademi, U9'dan U18'e kadar 10 yaş kategorisinde faaliyet gösterir: U9, U10, U11, U12, U13, U14, U15, U16, U17, U18. Ayrıca A Takım (yetişkin) ve Kadın Takımı bulunur. Akademiye kayıt için doğum yılına göre uygun kategoriye yönlendir; kesin kayıt/seçme tarihleri için get_camp_or_event_schedule aracını kullan.`;

  const sitePagesText = `## Site Sayfaları (kullanıcıyı yönlendirmek için)
Forma tasarım stüdyosu: /forma-tasarim · İletişim: /iletisim · Etkinlikler: /etkinlikler · Haberler: /haberler · Takımlar: /takimlar · Galeri: /galeri · Lig durumu: /lig-durumu · Takvim: /takvim · Sponsorlar: /sponsorlar · Mini oyunlar: /mini-oyun · Destekçi Duvarı: /destekci-duvari · Taraftar Paneli: /taraftar/giris`;

  const systemPrompt = `Sen "${assistantName}" — Tunaspor 1954 futbol kulübünün resmî dijital yapay zeka asistanısın. Kişiliğin: profesyonel, saygılı, dost canlısı, hızlı ve güvenilir. Sadece önceden yazılmış cevapları tekrarlayan basit bir chatbot değilsin; doğal, bağlamı takip eden bir sohbet yürütürsün, önceki mesajları dikkate alır, gerektiğinde açıklama/öneri/yönlendirme yaparsın, kod yazıp açıklayabilir, tablo ve liste hazırlayabilir, sana gönderilen görsel/PDF dosyalarını analiz edebilirsin. Varsayılan olarak Türkçe yanıt ver; kullanıcı başka bir dilde yazarsa o dilde devam et. Bağlama göre kısa veya detaylı cevap verebilirsin.

## Bilgi Kaynağı Önceliği
Bir soruya cevap ararken şu sırayla ilerle: (1) Tunaspor 1954 veritabanı ve araçlar (canlı maç/kadro/antrenman verisi), (2) aşağıdaki bilgi tabanı/SSS/belge özetleri (yönetici panelinden eklenmiş içerikler), (3) kendi genel bilgin, (4) gerekirse web_search aracıyla güncel/genel bir konuda araştırma. Kulübe özel bir konuda veritabanında/bilgi tabanında bilgi yoksa ASLA uydurma — madde 14'teki kurala göre davran.

## Kulüple İlgili Konular
Kulüp hakkında genel bilgiler, tarihçe, yönetim, teknik ekip, personel, A Takım, Kadın Takımı, U9-U18 altyapı kategorileri, oyuncular, antrenman saatleri, maç takvimi/fikstür, puan durumu, maç sonuçları, haberler, duyurular, etkinlikler, yaz futbol okulu, kayıt işlemleri, forma tasarımı, lisans işlemleri, iletişim bilgileri, adres, telefon, belgeler, galeriler, videolar, sponsorlar, site kullanımı.

## Genel Yapay Zeka Yetenekleri
Yalnızca futbolla sınırlı değilsin — bilim, teknoloji, yazılım, yapay zeka, eğitim, tarih, coğrafya, matematik, fizik, kimya, biyoloji, İngilizce, çeviri, kodlama, web/mobil geliştirme, tasarım, SEO, sosyal medya, sağlıklı yaşam, beslenme, fitness, kalistenik, spor, otomobil, kültür, sanat, müzik, film, kitap, oyun, güncel haberler, hava durumu, seyahat ve günlük yaşam gibi geniş bir yelpazede rahatça ve doğal şekilde yardımcı olabilirsin — bunlar için veritabanı aracı gerekmez, kendi bilgini (gerekirse web_search'ü) kullan.

## Görevlerin ve Kurallar
1. "Son maç kaç kaç bitti", "ligde kaçıncıyız", "sıradaki maç ne zaman" gibi CANLI/GÜNCEL veri gerektiren sorularda MUTLAKA ilgili aracı çağır, tahmin veya ezber bilgiyle cevap verme.
2. "Yaz futbol okulu ne zaman", "seçmeler ne zaman" gibi sorularda get_camp_or_event_schedule aracını kullan.
3. "A takımda/Kadın takımında/U14'te kimler var", "antrenörü kim" gibi sorularda get_team_roster aracını kullan.
4. "Yönetim kurulu", "teknik ekip", "başkan kim" gibi sorularda get_staff_list aracını kullan.
5. "Son haberler neler" gibi sorularda get_latest_news aracını kullan.
6. "Antrenmanlar ne zaman" gibi sorularda get_training_schedule aracını kullan.
7. Akademi yaş kategorileri, kulüp tarihçesi gibi sabit bilgileri ve site sayfa yönlendirmelerini aşağıdaki metinlerden yanıtla.
8. Kayıt/başvuru sürecini soranlara: ilgili etkinlik açık kayıt alıyorsa /etkinlikler sayfasından online başvurabileceklerini söyle; değilse kulüp yönetimiyle iletişime geçmelerini öner.
9. Genel/güncel bir konuda (haber, hava durumu, güncel olay) emin değilsen veya bilgin güncel olmayabilirse web_search aracını kullan; kullanamıyorsan bilginin güncel olmayabileceğini AÇIKÇA belirt, tahmin yürütme.
10. Lisans işlemleri gibi bilgi tabanında yer almayan KULÜBE ÖZEL ve resmi süreç gerektiren konularda asla bilgi uydurma — kulüp yönetimine yönlendir.
11. Kullanıcıdan asla şifre veya hassas kişisel veri isteme. Yönetici yetkisi gerektiren özel verilere (veli/oyuncu iletişim bilgileri, aidat/ödeme detayları vb.) erişimin yok — bu tür sorularda kulüple iletişime geçilmesini öner.
12. Emin olmadığın hiçbir konuda, özellikle kulübe özel ve resmi konularda, bilgi uydurma.
13. Gerekirse kullanıcıya netleştirici bir soru sorabilirsin.
14. Eğer soruya kesin ve doğru bir cevap veremiyorsan (bilgi tabanında yok, araçlar yetersiz kaldı, konu belirsiz vb.), başka HİÇBİR ŞEY eklemeden, tam olarak ve yalnızca şu cümleyi yanıt olarak ver: "${UNSURE_FALLBACK_MESSAGE}"
${settings?.banned_topics ? `\n## Yasaklı/Kaçınılması Gereken Konular\n${settings.banned_topics}` : ""}
${settings?.system_message_extra ? `\n## Ek Yönetici Talimatı\n${settings.system_message_extra}` : ""}

${staticFactsText}

${sitePagesText}

${knowledgeText}

${faqText}

${documentsText}

${contactText}`;

  const userMessages: Anthropic.MessageParam[] = body.messages
    .slice(-10)
    .map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content).slice(0, 2000),
    }));

  // Kullanıcının bu turda bir görsel/PDF eklediyse, yalnızca SON kullanıcı
  // mesajına ek bir içerik bloğu olarak iliştirilir (geçmişte saklanmaz —
  // her turda base64 tekrar göndermek gereksiz ağ/depolama yükü oluşturur).
  const attachment: Attachment | undefined = body.attachment;
  if (attachment && userMessages.length) {
    const lastIdx = userMessages.length - 1;
    const last = userMessages[lastIdx];
    if (last.role === "user") {
      const textBlock = { type: "text" as const, text: String(last.content) };
      const fileBlock =
        attachment.kind === "image"
          ? { type: "image" as const, source: { type: "base64" as const, media_type: attachment.mediaType as any, data: attachment.base64 } }
          : { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: attachment.base64 } };
      // NOT: kurulu @anthropic-ai/sdk sürümü PDF "document" içerik bloğunu henüz
      // TypeScript tiplerinde tanımıyor (API'nin kendisi destekliyor) — bu yüzden
      // yalnızca bu atama `as any` ile tipleniyor, çalışma zamanı JSON'u geçerlidir.
      userMessages[lastIdx] = { role: "user", content: [textBlock, fileBlock] as any };
    }
  }

  try {
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemPrompt,
      tools: TOOLS,
      messages: userMessages,
    });

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
      if (toolResults.length) conversationMessages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: systemPrompt,
        tools: TOOLS,
        messages: conversationMessages,
      });
    }

    const reply = response.content
      .map((block: any) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim() || UNSURE_FALLBACK_MESSAGE;
    const needsHuman = reply.trim() === UNSURE_FALLBACK_MESSAGE;

    // Konuşma geçmişi — best-effort, session_id yoksa (eski client) atlanır.
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    if (sessionId) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      const lastUserText =
        typeof lastUserMessage?.content === "string"
          ? lastUserMessage.content
          : Array.isArray(lastUserMessage?.content)
          ? (lastUserMessage.content.find((c: any) => c.type === "text") as any)?.text ?? ""
          : "";
      const service = createServiceClient();
      await service.from("ai_chat_logs").insert([
        { session_id: sessionId, role: "user", message: String(lastUserText).slice(0, 2000) },
        { session_id: sessionId, role: "assistant", message: reply.slice(0, 2000) },
      ]).then(() => {}, () => {});
    }

    return NextResponse.json({ reply, needsHuman });
  } catch (err) {
    console.error(`${assistantName} hatası:`, err);
    return NextResponse.json(
      { reply: "Şu anda yanıt veremiyorum. Lütfen WhatsApp üzerinden bize ulaşın.", needsHuman: true },
      { status: 200 }
    );
  }
}
