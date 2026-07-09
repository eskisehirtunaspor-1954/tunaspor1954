import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MatchCountdown } from "./MatchCountdown";

export async function NextMatchCard() {
  const supabase = createClient();
  const { data: match } = await supabase
    .from("fixtures")
    .select("*")
    .gte("match_date", new Date().toISOString())
    .order("match_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!match) {
    return (
      <div className="glass-panel border border-tuna-gold/25 p-6 w-full max-w-sm text-center">
        <p className="text-sm text-tuna-mist">Yaklaşan maç bilgisi yakında eklenecek.</p>
      </div>
    );
  }

  const date = new Date(match.match_date);
  const home = match.home_or_away === "home" ? "Tunaspor 1954" : match.opponent;
  const away = match.home_or_away === "home" ? match.opponent : "Tunaspor 1954";

  return (
    <div className="glass-panel border border-tuna-gold/25 p-6 w-full max-w-sm relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-tuna-gold-radial rounded-full" />
      <p className="eyebrow mb-4 relative">SIRADAKİ MAÇ</p>
      <div className="flex items-center justify-between mb-4 relative">
        <div className="text-center flex-1">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-tuna-gold/30 mx-auto mb-2 flex items-center justify-center font-display text-tuna-gold text-xl">
            {home.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs">{home}</p>
        </div>
        <span className="font-display text-2xl text-tuna-gold px-2">VS</span>
        <div className="text-center flex-1">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/15 mx-auto mb-2 flex items-center justify-center font-display text-xl">
            {away.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs">{away}</p>
        </div>
      </div>
      <div className="mb-5 relative">
        <MatchCountdown matchDate={match.match_date} />
      </div>
      <div className="space-y-1 text-sm text-tuna-mist mb-5 relative">
        <p>📅 {date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        <p>🕒 {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
        {match.venue && <p>📍 {match.venue}</p>}
      </div>
      <Link
        href="/takimlar/a_takim"
        className="block text-center bg-tuna-gold text-tuna-black font-semibold py-2 rounded-full hover:brightness-110 transition relative"
      >
        Detaylar
      </Link>
    </div>
  );
}
