import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 60%)" }}
      />
      <p className="font-display text-[8rem] sm:text-[10rem] leading-none text-tuna-gold" style={{ textShadow: "0 0 40px rgba(255,215,0,0.4)" }}>
        404
      </p>
      <h1 className="font-display text-2xl sm:text-3xl mt-2 mb-3">Bu sayfa kayıp bir pas gibi kayboldu</h1>
      <p className="text-tuna-mist max-w-md mb-8">
        Aradığın sayfa taşınmış, kaldırılmış olabilir ya da hiç var olmadı.
        Ama merak etme, seni sahaya geri getirelim.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="flex items-center gap-2 bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-full hover:brightness-110 hover:shadow-goldGlow transition-all"
        >
          <Home size={18} /> Anasayfaya Dön
        </Link>
        <Link
          href="/haberler"
          className="flex items-center gap-2 border border-tuna-gold/40 px-6 py-3 rounded-full hover:border-tuna-gold hover:shadow-goldGlow transition-all"
        >
          <Search size={18} /> Haberlere Göz At
        </Link>
      </div>
    </div>
  );
}
