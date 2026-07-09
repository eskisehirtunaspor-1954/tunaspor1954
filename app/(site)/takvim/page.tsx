import { createClient } from "@/lib/supabase/server";
import { ClubCalendar } from "@/components/home/ClubCalendar";
import { Suspense } from "react";
import { T } from "@/components/layout/T";

export const metadata = { title: "Kulüp Takvimi" };

export default async function TakvimPage() {
  const supabase = createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, display_name")
    .eq("is_published", true);

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="page_calendar_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_calendar_title" as="h1" className="font-display text-4xl mb-10" />
      <Suspense fallback={<T k="loading" as="p" className="text-tuna-mist" />}>
        <ClubCalendar teams={teams ?? []} />
      </Suspense>
    </div>
  );
}
