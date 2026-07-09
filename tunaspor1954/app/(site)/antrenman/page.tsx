import { createClient } from "@/lib/supabase/server";
import { WeatherWidget } from "@/components/home/WeatherWidget";
import { T } from "@/components/layout/T";

export const metadata = { title: "Antrenman Programı" };

export default async function AntrenmanPage() {
  const supabase = createClient();
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*, teams(display_name), staff_members(full_name)")
    .gte("session_date", new Date().toISOString().slice(0, 10))
    .order("session_date")
    .limit(20);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="flex items-start justify-between flex-wrap gap-6 mb-10">
        <div>
          <T k="page_training_eyebrow" as="p" className="eyebrow mb-3" />
          <T k="page_training_title" as="h1" className="font-display text-4xl" />
        </div>
        <div className="w-64"><WeatherWidget /></div>
      </div>

      <div className="space-y-3">
        {(sessions ?? []).map((s: any) => (
          <div key={s.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{s.teams?.display_name ?? "Takım"}</p>
              <p className="text-xs text-tuna-mist">
                {s.venue} {s.staff_members?.full_name ? `— ${s.staff_members.full_name}` : ""}
              </p>
            </div>
            <div className="text-sm text-tuna-mist text-right">
              <p>{new Date(s.session_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}</p>
              <p>{s.start_time?.slice(0,5)} {s.end_time ? `- ${s.end_time.slice(0,5)}` : ""}</p>
            </div>
          </div>
        ))}
        {!sessions?.length && <p className="text-tuna-mist">Yakında antrenman programı yayınlanacak.</p>}
      </div>
    </div>
  );
}
