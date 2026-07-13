import { User, Shirt } from "lucide-react";

export interface PlayerCardData {
  id: string;
  full_name: string;
  position?: string | null;
  jersey_number?: number | null;
  birth_date?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  photo_url?: string | null;
  license_no?: string | null;
  preferred_foot?: "sag" | "sol" | "cift" | null;
  joined_at?: string | null;
}

const FOOT_LABEL: Record<string, string> = { sag: "Sağ", sol: "Sol", cift: "Çift" };

// U kategorileri kadro listesi için premium oyuncu kartı: foto, forma no,
// doğum tarihi, boy/kilo, mevki, lisans no, ayak tercihi, takıma katılış tarihi.
// Fotoğraf yoksa lucide User ikonuyla zarif bir placeholder gösterilir — kırık
// img yerine tutarlı bir görünüm sağlar.
export function PlayerCard({ player }: { player: PlayerCardData }) {
  const birthDate = player.birth_date
    ? new Date(player.birth_date).toLocaleDateString("tr-TR")
    : null;
  const joinedDate = player.joined_at
    ? new Date(player.joined_at).toLocaleDateString("tr-TR")
    : null;

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
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-tuna-mist">
          {birthDate && <span>{birthDate}</span>}
          {player.height_cm && <span>{player.height_cm} cm</span>}
          {player.weight_kg && <span>{player.weight_kg} kg</span>}
          {player.preferred_foot && <span>{FOOT_LABEL[player.preferred_foot]} ayak</span>}
        </div>
        {(player.license_no || joinedDate) && (
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-tuna-mist/70">
            {player.license_no && <span>Lisans: {player.license_no}</span>}
            {joinedDate && <span>Katılış: {joinedDate}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Oyuncu henüz eklenmemiş forma yuvaları için sessiz, premium bir placeholder —
// metinsel "kadro boş" mesajı yerine kadronun dolacağı hissi verir.
export function EmptyPlayerCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/10 p-0 text-center">
      <div className="aspect-[3/4] w-full flex items-center justify-center bg-white/[0.02]">
        <Shirt size={40} className="text-white/10" />
      </div>
      <div className="p-3">
        <p className="text-xs text-tuna-mist/50">Oyuncu eklenmedi</p>
      </div>
    </div>
  );
}
