/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          dark:        "#f5f7fb",
          obsidian:    "#ffffff",
          deep:        "#ffffff",
          surface:     "rgba(255, 255, 255, 0.7)",
          card:        "rgba(255, 255, 255, 0.5)",
          glass:       "rgba(255, 255, 255, 0.6)",
          glassHover:  "rgba(255, 255, 255, 0.9)",
          border:      "rgba(148, 163, 184, 0.18)",
          borderGlow:  "rgba(167, 139, 250, 0.2)",
          accent:       "#a78bfa",
          accentHover:  "#8b5cf6",
          accentDim:    "#c4b5fd",
          cyan:         "#7dd3fc",
          pink:         "#f9a8d4",
          emerald:      "#6ee7b7",
          success:      "#34d399",
          warning:      "#fbbf24",
          danger:       "#fda4af",
          text:    "#111827",
          muted:   "#6b7280",
          subtle:  "#9ca3af",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      animation: {
        "float":         "float 5s ease-in-out infinite",
        "float-slow":    "float 7s ease-in-out infinite",
        "float-fast":    "float 4s ease-in-out infinite",
        "rise-in":       "rise-in 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "mercury-pulse": "mercury-pulse 3s ease-in-out infinite",
        "mercury-active":"mercury-pulse-active 1.8s ease-in-out infinite",
        "holo-breathe":  "holo-breathe 3s ease-in-out infinite",
        "ripple-out":    "ripple-out 1.8s ease-out infinite",
        "spin-fast":     "spin 0.8s linear infinite",
        "glow-pulse":    "glow-pulse 2s ease-in-out infinite",
        "orb-drift":     "orb-drift 20s ease-in-out infinite alternate",
        "badge-in":      "badge-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "mesh-rotate":   "mesh-rotate 720s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(30px) scale(0.94)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "orb-drift": {
          "0%":   { transform: "translate(0, 0) scale(1)" },
          "33%":  { transform: "translate(40px, -30px) scale(1.05)" },
          "66%":  { transform: "translate(-20px, 20px) scale(0.97)" },
          "100%": { transform: "translate(30px, 10px) scale(1.02)" },
        },
        "mercury-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.1), inset 0 2px 4px rgba(255,255,255,0.5)" },
          "50%":      { boxShadow: "0 0 40px rgba(124,58,237,0.2), inset 0 2px 4px rgba(255,255,255,0.8)" },
        },
        "mercury-pulse-active": {
          "0%, 100%": { boxShadow: "0 0 30px rgba(6,182,212,0.3), transform: scale(1)" },
          "50%":      { boxShadow: "0 0 50px rgba(6,182,212,0.5), transform: scale(1.05)" },
        },
        "holo-breathe": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(108,99,255,0.6))" },
          "50%":      { filter: "drop-shadow(0 0 18px rgba(108,99,255,1)) drop-shadow(0 0 30px rgba(34,211,238,0.4))" },
        },
        "ripple-out": {
          "0%":   { transform: "scale(0.7)", opacity: "0.9" },
          "100%": { transform: "scale(2.8)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "mesh-rotate": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "badge-in": {
          from: { opacity: "0", transform: "scale(0.8) translateY(4px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
