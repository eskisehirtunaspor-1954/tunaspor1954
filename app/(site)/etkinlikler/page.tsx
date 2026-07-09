import { createClient } from "@/lib/supabase/server";
import { EventRegisterForm } from "@/components/home/EventRegisterForm";
import { T } from "@/components/layout/T";

export const metadata = { title: "Etkinlikler" };

const TYPE_KEYS: Record<string, string> = {
  yaz_kampi: "event_type_yaz_kampi",
  turnuva: "event_type_turnuva",
  secme: "event_type_secme",
  seminer: "event_type_seminer",
  etkinlik: "event_type_etkinlik",
};

export default async function EtkinliklerPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <T k="page_events_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_events_title" as="h1" className="font-display text-4xl mb-10" />
      <div className="space-y-6">
        {(events ?? []).map((ev) => (
          <div key={ev.id} className="glass-panel p-6">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
              <div>
                <T k={TYPE_KEYS[ev.type] ?? ev.type} as="span" className="eyebrow" />
                <h2 className="font-display text-2xl">{ev.title}</h2>
              </div>
              <span className="text-sm text-tuna-mist">
                {new Date(ev.start_date).toLocaleDateString("tr-TR", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </span>
            </div>
            {ev.description && <p className="text-tuna-mist mb-4">{ev.description}</p>}
            {ev.location && <p className="text-sm text-tuna-mist mb-4">📍 {ev.location}</p>}
            {ev.registration_open ? (
              <EventRegisterForm eventId={ev.id} />
            ) : (
              <p className="text-sm text-tuna-mist italic">Bu etkinlik için kayıt şu anda kapalı.</p>
            )}
          </div>
        ))}
        {!events?.length && <T k="page_events_empty" as="p" className="text-tuna-mist" />}
      </div>
    </div>
  );
}
