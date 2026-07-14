"use client";

interface JerseyPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  pattern: "duz" | "cizgili" | "capraz" | "parcali" | "geometrik" | "kamuflaj" | "gradient";
  playerName?: string;
  playerNumber?: string;
  className?: string;
}

// Basit ama tanınabilir bir forma silueti — kol/gövde tek path, desen katmanı
// üzerine bindirilir. Canvas yerine SVG tercih edildi: her boyutta keskin kalır,
// metin (isim/numara) doğrudan SVG <text> ile net şekilde render edilir.
export function JerseyPreview({
  primaryColor,
  secondaryColor,
  tertiaryColor,
  pattern,
  playerName,
  playerNumber,
  className,
}: JerseyPreviewProps) {
  const jerseyPath =
    "M70 10 L100 0 L130 10 L150 0 L190 30 L170 60 L150 50 L150 190 L50 190 L50 50 L30 60 L10 30 L50 0 Z";

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Forma tasarımı önizlemesi">
      <defs>
        <clipPath id="jerseyClip">
          <path d={jerseyPath} />
        </clipPath>
        <linearGradient id="jerseyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="50%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={tertiaryColor ?? primaryColor} />
        </linearGradient>
      </defs>

      {/* Ana forma rengi (gradient deseninde doğrudan gradyan dolgu kullanılır) */}
      <path d={jerseyPath} fill={pattern === "gradient" ? "url(#jerseyGradient)" : primaryColor} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />

      {/* Desen katmanı — forma şekliyle klip'lenir, dışına taşmaz */}
      <g clipPath="url(#jerseyClip)">
        {pattern === "cizgili" &&
          Array.from({ length: 5 }).map((_, i) => (
            <rect key={i} x={20 + i * 32} y={0} width={14} height={200} fill={secondaryColor} opacity={0.9} />
          ))}
        {pattern === "capraz" && (
          <>
            <rect x={-20} y={90} width={240} height={20} fill={secondaryColor} transform="rotate(-20 100 100)" opacity={0.9} />
            <rect x={-20} y={90} width={240} height={20} fill={secondaryColor} transform="rotate(20 100 100)" opacity={0.9} />
          </>
        )}
        {pattern === "duz" && <rect x={0} y={0} width={40} height={200} fill={secondaryColor} opacity={0.85} />}
        {pattern === "parcali" && <rect x={0} y={0} width={100} height={200} fill={secondaryColor} opacity={0.9} />}
        {pattern === "geometrik" &&
          Array.from({ length: 6 }).map((_, i) => (
            <polygon key={i} points="10,10 25,25 10,40 -5,25" transform={`translate(${(i % 3) * 65}, ${Math.floor(i / 3) * 90})`} fill={secondaryColor} opacity={0.85} />
          ))}
        {pattern === "kamuflaj" &&
          Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx={(i * 47) % 200} cy={(i * 71) % 200} rx={22} ry={16} fill={i % 2 ? secondaryColor : tertiaryColor ?? secondaryColor} opacity={0.6} />
          ))}
      </g>

      {/* Yaka */}
      <path d="M80 8 Q100 28 120 8" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />

      {/* Sırt numarası */}
      {playerNumber && (
        <text
          x="100"
          y="130"
          textAnchor="middle"
          fontSize="56"
          fontWeight="700"
          fill="white"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1"
          fontFamily="sans-serif"
        >
          {playerNumber}
        </text>
      )}

      {/* Sırt ismi */}
      {playerName && (
        <text
          x="100"
          y="60"
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="white"
          letterSpacing="1"
          fontFamily="sans-serif"
        >
          {playerName.toUpperCase().slice(0, 12)}
        </text>
      )}
    </svg>
  );
}
