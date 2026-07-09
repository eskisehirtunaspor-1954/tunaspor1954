import { createClient } from "@/lib/supabase/server";
import { T } from "@/components/layout/T";

export const metadata = { title: "Canlı Lig Durumu" };

export default async function LigDurumuPage() {
  const supabase = createClient();

  const [{ data: table }, { data: fixtures }] = await Promise.all([
    supabase.from("league_table_rows").select("*").order("rank"),
    supabase.from("fixtures").select("*").order("match_date", { ascending: true }),
  ]);

  const season = table?.[0]?.season;
  const leagueName = table?.[0]?.league_name;
  const upcoming = (fixtures ?? []).filter((f) => new Date(f.match_date) >= new Date());
  const past = (fixtures ?? []).filter((f) => new Date(f.match_date) < new Date()).reverse();

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <T k="page_standings_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_standings_title" as="h1" className="font-display text-4xl mb-2" />
      {leagueName && (
        <p className="text-tuna-mist mb-10">{leagueName} — {season}</p>
      )}

      {/* PUAN DURUMU */}
      <section className="mb-16 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[560px]">
          <thead>
            <tr className="text-left text-tuna-mist border-b border-white/10">
              <th className="py-3 pr-2">#</th>
              <th className="py-3 pr-2">Takım</th>
              <th className="py-3 px-2 text-center">O</th>
              <th className="py-3 px-2 text-center">G</th>
              <th className="py-3 px-2 text-center">B</th>
              <th className="py-3 px-2 text-center">M</th>
              <th className="py-3 px-2 text-center">AV</th>
              <th className="py-3 pl-2 text-center">P</th>
            </tr>
          </thead>
          <tbody>
            {(table ?? []).map((row) => (
              <tr
                key={row.id}
                className={`border-b border-white/5 ${row.is_own_team ? "bg-tuna-gold/10 text-tuna-gold font-semibold" : ""}`}
              >
                <td className="py-3 pr-2">{row.rank}</td>
                <td className="py-3 pr-2">{row.team_name}</td>
                <td className="py-3 px-2 text-center">{row.played}</td>
                <td className="py-3 px-2 text-center">{row.won}</td>
                <td className="py-3 px-2 text-center">{row.drawn}</td>
                <td className="py-3 px-2 text-center">{row.lost}</td>
                <td className="py-3 px-2 text-center">{row.goals_for - row.goals_against}</td>
                <td className="py-3 pl-2 text-center font-semibold">{row.points}</td>
              </tr>
            ))}
            {!table?.length && (
              <tr><td colSpan={8} className="py-6 text-center text-tuna-mist">Puan durumu yakında eklenecek.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* FİKSTÜR */}
      <section className="mb-16">
        <h2 className="font-display text-2xl mb-6">Yaklaşan Maçlar</h2>
        <div className="space-y-2">
          {upcoming.map((f) => (
            <div key={f.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
              <span className="font-medium">
                {f.home_or_away === "home" ? `Tunaspor 1954 - ${f.opponent}` : `${f.opponent} - Tunaspor 1954`}
              </span>
              <span className="text-sm text-tuna-mist">
                {new Date(f.match_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })} · {new Date(f.match_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                {f.venue && ` · ${f.venue}`}
              </span>
            </div>
          ))}
          {!upcoming.length && <p className="text-tuna-mist">Planlanmış maç bulunmuyor.</p>}
        </div>
      </section>

      {/* SONUÇLAR */}
      {!!past.length && (
        <section>
          <h2 className="font-display text-2xl mb-6">Son Sonuçlar</h2>
          <div className="space-y-2">
            {past.slice(0, 8).map((f) => (
              <div key={f.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium">
                  {f.home_or_away === "home" ? `Tunaspor 1954 - ${f.opponent}` : `${f.opponent} - Tunaspor 1954`}
                </span>
                <span className="text-sm text-tuna-gold font-semibold">
                  {f.home_score ?? "-"} : {f.away_score ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
