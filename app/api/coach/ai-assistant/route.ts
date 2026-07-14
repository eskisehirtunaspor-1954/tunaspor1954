import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoachSession } from "@/lib/coach-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Taraftar/site AI asistanından (app/api/chat) TAMAMEN AYRI bir sistem — yalnızca
// giriş yapmış antrenörlere açık, kendi takımının GERÇEK verisiyle (kadro, devam
// durumu, değerlendirme puanları, maç programı) beslenir. Genel futbol/antrenman
// bilgisi (haftalık program, ısınma, taktik önerisi vb.) modelin kendi bilgisinden
// üretilir — bunlar "kesin veri" değil, uzman önerisi olarak sunulur.
const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_roster_with_stats",
    description:
      "Antrenörün takımındaki oyuncuların tam listesini (mevki, forma no, doğum tarihi, maç istatistikleri) döner. Yaş grubuna özel antrenman veya kadro önerisi hazırlarken bunu kullan.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_attendance_and_development",
    description:
      "Her oyuncunun antrenman devam yüzdesini ve en son antrenör değerlendirme puanlarını (teknik/taktik/fiziksel/mental) döner. Güçlü/zayıf yön analizi veya gelişim önerisi hazırlarken bunu kullan.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_upcoming_and_recent_fixtures",
    description:
      "Takımın yaklaşan maçını (rakip, tarih) ve son oynanan maçların sonuçlarını döner. Rakip analizi, kadro önerisi veya maç sonrası analiz hazırlarken bunu kullan.",
    input_schema: { type: "object", properties: {} },
  },
];

async function getCoachTeamIds(coachId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("coach_team_assignments").select("team_id").eq("coach_id", coachId);
  return (data ?? []).map((a: any) => a.team_id);
}

async function executeTool(name: string, teamIds: string[]): Promise<string> {
  if (!teamIds.length) return "Bu antrenöre henüz bir takım/kategori atanmamış.";
  const supabase = createServiceClient();

  if (name === "get_roster_with_stats") {
    const { data } = await supabase
      .from("players")
      .select("full_name, position, jersey_number, birth_date, stats")
      .in("team_id", teamIds)
      .eq("is_published", true);
    if (!data?.length) return "Kadroda oyuncu bulunmuyor.";
    return data
      .map((p: any) => {
        const age = p.birth_date ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000) : null;
        return `${p.full_name} — ${p.position ?? "mevki belirtilmedi"}, #${p.jersey_number ?? "-"}${age ? `, ${age} yaş` : ""}${p.stats ? `, istatistik: ${JSON.stringify(p.stats)}` : ""}`;
      })
      .join("\n");
  }

  if (name === "get_attendance_and_development") {
    const { data: players } = await supabase.from("players").select("id, full_name").in("team_id", teamIds);
    const playerIds = (players ?? []).map((p: any) => p.id);
    if (!playerIds.length) return "Kadroda oyuncu bulunmuyor.";

    const [{ data: attendance }, { data: evaluations }] = await Promise.all([
      supabase.from("training_attendance").select("player_id, status").in("player_id", playerIds),
      supabase
        .from("player_coach_evaluations")
        .select("player_id, period_label, technical_score, tactical_score, physical_score, mental_score, comment")
        .in("player_id", playerIds)
        .order("created_at", { ascending: false }),
    ]);

    return (players ?? [])
      .map((p: any) => {
        const rows = (attendance ?? []).filter((a: any) => a.player_id === p.id);
        const attended = rows.filter((a: any) => a.status === "katildi").length;
        const pct = rows.length ? Math.round((attended / rows.length) * 100) : null;
        const latestEval = (evaluations ?? []).find((e: any) => e.player_id === p.id);
        return `${p.full_name} — Devam: ${pct !== null ? `%${pct}` : "veri yok"}${
          latestEval
            ? `, son değerlendirme (${latestEval.period_label}): teknik ${latestEval.technical_score}/10, taktik ${latestEval.tactical_score}/10, fiziksel ${latestEval.physical_score}/10, mental ${latestEval.mental_score}/10${latestEval.comment ? `, not: ${latestEval.comment}` : ""}`
            : ", değerlendirme yok"
        }`;
      })
      .join("\n");
  }

  if (name === "get_upcoming_and_recent_fixtures") {
    const [{ data: upcoming }, { data: recent }] = await Promise.all([
      supabase.from("fixtures").select("*").in("team_id", teamIds).gte("match_date", new Date().toISOString()).order("match_date").limit(1),
      supabase.from("fixtures").select("*").in("team_id", teamIds).eq("status", "finished").order("match_date", { ascending: false }).limit(5),
    ]);
    const next = upcoming?.[0]
      ? `Sıradaki maç: vs ${upcoming[0].opponent}, ${new Date(upcoming[0].match_date).toLocaleDateString("tr-TR")}${upcoming[0].venue ? `, ${upcoming[0].venue}` : ""}.`
      : "Yaklaşan maç girilmemiş.";
    const history = (recent ?? [])
      .map((f: any) => `${new Date(f.match_date).toLocaleDateString("tr-TR")}: vs ${f.opponent} ${f.home_score ?? "?"}-${f.away_score ?? "?"}`)
      .join("\n");
    return `${next}\n\nSon maçlar:\n${history || "kayıt yok"}`;
  }

  return "Bilinmeyen araç.";
}

export async function POST(req: NextRequest) {
  const session = await getCoachSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });

  if (!checkRateLimit("coach-ai-assistant", getClientIp(req), { windowMs: 60_000, max: 15 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const teamIds = await getCoachTeamIds(session.coachId);

  const systemPrompt = `Sen "TUNA ANTRENÖR AI" — Tunaspor 1954 antrenörlerine yardımcı olan uzman bir futbol antrenmanı/performans asistanısın. Yalnızca giriş yapmış antrenörler seninle konuşabilir. Türkçe yanıt ver, profesyonel ve uygulanabilir ol.

Yapabileceklerin:
1. Haftalık antrenman programı hazırlama (yaş grubuna göre uyarlanmış).
2. Dayanıklılık, teknik, taktik ve kaleci antrenmanları oluşturma.
3. Isınma ve soğuma programı hazırlama.
4. Oyuncuların gelişimini analiz etme, eksik/güçlü yönlerini belirleme (get_attendance_and_development aracıyla gerçek verilere dayan).
5. Rakip analizi ve maç sonrası analiz hazırlama (get_upcoming_and_recent_fixtures aracıyla).
6. Kadro/oyuncu değişikliği önerileri sunma (get_roster_with_stats ve get_attendance_and_development ile).

Kurallar:
- Oyuncu isimleri, kadro, devam durumu, değerlendirme puanları veya maç sonuçları hakkında konuşurken MUTLAKA ilgili aracı çağır — ASLA uydurma isim veya istatistik verme.
- Antrenman programı/taktik/ısınma gibi genel spor bilimi önerilerinde kendi uzman bilgini kullanabilirsin — bunlar senin önerin olduğunu, kulübün kesin politikası olmadığını belirt.
- Cevapların kısa değil, doğrudan uygulanabilir (madde madde, süre/tekrar sayısı belirterek) olsun.`;

  const userMessages: Anthropic.MessageParam[] = body.messages
    .slice(-10)
    .map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content).slice(0, 3000),
    }));

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
          const result = await executeTool(block.name, teamIds);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      conversationMessages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: systemPrompt,
        tools: TOOLS,
        messages: conversationMessages,
      });
    }

    const reply = response.content.map((block: any) => (block.type === "text" ? block.text : "")).join("\n") || "Yanıt üretilemedi.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("TUNA ANTRENÖR AI hatası:", err);
    return NextResponse.json({ reply: "Şu anda yanıt veremiyorum, lütfen daha sonra tekrar deneyin." }, { status: 200 });
  }
}
