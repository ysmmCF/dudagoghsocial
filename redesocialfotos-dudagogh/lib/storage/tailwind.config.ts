import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        starry: {
          night: "#060919",
          deep: "#0a0e27",
          navy: "#0f1738",
          blue: "#1a2656",
          azure: "#253b7c",
          gold: "#f5b027",
          "gold-light": "#fde047",
          "gold-glow": "rgba(245, 176, 39, 0.25)",
          cream: "#fef9c3",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "Inter", "sans-serif"],
      },
      animation: {
        "twinkle-slow": "twinkle 4s ease-in-out infinite",
        "twinkle-fast": "twinkle 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "swirl": "swirl 20s linear infinite",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", filter: "drop-shadow(0 0 15px rgba(245, 176, 39, 0.4))" },
          "50%": { opacity: "0.8", filter: "drop-shadow(0 0 30px rgba(245, 176, 39, 0.8))" },
        },
        swirl: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      backgroundImage: {
        "starry-gradient": "radial-gradient(ellipse at top, #1a2656 0%, #0a0e27 60%, #060919 100%)",
        "gold-gradient": "linear-gradient(135deg, #fde047 0%, #f5b027 50%, #d97706 100%)",
        "card-glass": "linear-gradient(135deg, rgba(15, 23, 56, 0.75) 0%, rgba(10, 14, 39, 0.85) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
