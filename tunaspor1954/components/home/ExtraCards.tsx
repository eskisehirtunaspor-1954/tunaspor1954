import Link from "next/link";
import { PlayCircle, GraduationCap, Users, Shirt } from "lucide-react";

const CARDS = [
  { icon: PlayCircle, title: "Tanıtım Filmi", href: "/galeri", desc: "Kulübümüzü anlatan sinematik tanıtım filmi" },
  { icon: GraduationCap, title: "Akademi", href: "/akademi", desc: "U9'dan U18'e alt yapı programımız" },
  { icon: Users, title: "Kadın Takımı", href: "/takimlar/kadin_takimi", desc: "Kadın futbolunda Eskişehir'in temsilcisi" },
  { icon: Shirt, title: "Forma Tanıtımı", href: "/galeri", desc: "Yeni sezon formalarımızı keşfedin" },
];

export function ExtraCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CARDS.map(({ icon: Icon, title, href, desc }) => (
        <Link
          key={title}
          href={href}
          className="group glass-panel p-6 border border-white/10 hover:border-tuna-gold/50 hover:-translate-y-1 hover:shadow-goldGlow transition-all duration-300"
        >
          <Icon className="text-tuna-gold mb-3 group-hover:scale-110 transition-transform" size={28} />
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-xs text-tuna-mist">{desc}</p>
        </Link>
      ))}
    </div>
  );
}
