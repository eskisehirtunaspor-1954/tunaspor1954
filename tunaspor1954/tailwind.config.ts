import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tunaspor 1954 premium kimliği: altın + siyah
        tuna: {
          black: "#050505",
          charcoal: "#111111",
          slate: "#1B1B1B",
          gold: "#FFD700",
          goldDim: "#E6B800",
          bronze: "#C89B3C",
          mist: "#9CA3AF",
          white: "#F5F5F5",
          // Geriye dönük uyumluluk (eski bileşenler bunları hâlâ kullanıyor)
          yellow: "#FFD700",
          amber: "#E6B800",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        subtitle: ["var(--font-subtitle)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "tuna-glass":
          "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(5,5,5,0.6) 60%)",
        "tuna-gold-radial":
          "radial-gradient(circle, rgba(255,215,0,0.25) 0%, rgba(255,215,0,0) 70%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        goldGlow: "0 0 24px rgba(255,215,0,0.35)",
        goldGlowLg: "0 0 48px rgba(255,215,0,0.45)",
      },
      backdropBlur: {
        glass: "26px",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        breathe: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.04)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        floatSlow: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        cloudDrift: { "0%": { transform: "translateX(-10%)" }, "100%": { transform: "translateX(110%)" } },
      },
      animation: {
        fadeUp: "fadeUp 0.7s ease-out forwards",
        breathe: "breathe 4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        cloudDrift: "cloudDrift 60s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
