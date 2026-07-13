import { User } from "lucide-react";

export interface PlayerCardData {
  id: string;
  full_name: string;
  position?: string | null;
  jersey_number?: number | null;
  birth_date?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  photo_url?: string | null;
}

// U kategorileri kadro listesi için premium oyuncu kartı: foto, forma no,
// doğum yılı, boy/kilo, mevki. Fotoğraf yoksa lucide User ikonuyla zarif bir
// placeholder gösterilir — kırık img yerine tutarlı bir görünüm sağlar.
export function PlayerCard({ player }: { player: PlayerCardData }) {
  const birthYear = player.birth_date ? new Date(player.birth_date).getFullYear() : null;

  return (
    <div className="glass-panel group relative overflow-hidden rounded-2xl p-0 text-center transition-all hover:border-tuna-gold/60 hover:shadow-goldGlow">
      <div className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-tuna-black/70 font-display text-lg text-tuna-gold ring-1 ring-tuna-gold/40">
        {player.jersey_number ?? "-"}
      </div>

      <div className="aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-white/10 to-transparent">
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.full_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User size={48} className="text-white/20" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-semibold">{player.full_name}</p>
        {player.position && <p className="text-xs text-tuna-gold">{player.position}</p>}
        <div className="mt-2 flex justify-center gap-3 text-[11px] text-tuna-mist">
          {birthYear && <span>{birthYear}</span>}
          {player.height_cm && <span>{player.height_cm} cm</span>}
          {player.weight_kg && <span>{player.weight_kg} kg</span>}
        </div>
      </div>
    </div>
  );
}
