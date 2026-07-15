import Link from "next/link";

export interface StaffCardData {
  id: string;
  full_name: string;
  role: string;
  photo_url?: string | null;
  uefa_license?: string | null;
  specialization?: string | null;
  start_date?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  social_media?: Record<string, string> | null;
}

const SOCIAL_KEYS = ["instagram", "twitter", "facebook", "linkedin"] as const;

// Premium siyah-altın, glassmorphism antrenör/personel kartı — kulüp logosu
// arka planda filigran, hover'da hafif büyüme + altın parlama. Karta tıklamak
// /personel/[id] tam ekran detay sayfasını açar (spesifikasyondaki "tam ekran
// veya modal" seçeneklerinden ilkini karşılar — ayrı bir modal bileşeni
// gerektirmeden aynı deneyimi sağlar).
export function StaffCard({ staff }: { staff: StaffCardData }) {
  const social = staff.social_media ?? {};
  const socialEntries = SOCIAL_KEYS.filter((k) => social[k]);

  return (
    <Link
      href={`/personel/${staff.id}`}
      className="group relative glass-panel overflow-hidden p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-goldGlowLg hover:border-tuna-gold/50"
    >
      {/* Filigran: kulüp logosu arka planda, hafif saydam */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.04] pointer-events-none group-hover:opacity-[0.07] transition-opacity"
        style={{ backgroundImage: "url(/images/logo.png)", backgroundSize: "70%" }}
      />

      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staff.photo_url || "/images/logo.png"}
          alt={staff.full_name}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-tuna-gold/30 group-hover:border-tuna-gold transition-colors"
        />
        <p className="font-semibold text-sm">{staff.full_name}</p>
        <p className="text-xs text-tuna-gold mb-1">{staff.role}</p>
        {staff.uefa_license && <p className="text-[11px] text-tuna-mist">🎖️ {staff.uefa_license}</p>}
        {staff.specialization && <p className="text-[11px] text-tuna-mist">{staff.specialization}</p>}
        {staff.start_date && (
          <p className="text-[10px] text-tuna-mist/70 mt-1">
            Kulüpte {new Date(staff.start_date).getFullYear()}'ten beri
          </p>
        )}
        {staff.bio && <p className="text-[11px] text-tuna-mist mt-2 line-clamp-2">{staff.bio}</p>}

        {(staff.phone || staff.email || socialEntries.length > 0) && (
          <div className="flex items-center justify-center gap-2 mt-3 text-tuna-mist">
            {socialEntries.map((k) => (
              <span key={k} className="text-[10px] border border-white/15 rounded-full px-2 py-0.5 capitalize group-hover:border-tuna-gold/40">
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
