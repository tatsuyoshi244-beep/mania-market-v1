import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        paper: "#f8f5ef",
        moss: "#526348",
        cinnabar: "#b95032",
        lagoon: "#315c68"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out both",
        float: "float 6s ease-in-out infinite"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      boxShadow: {
        editorial: "0 24px 48px -12px rgba(23, 32, 38, 0.18)",
        glow: "0 0 0 1px rgba(248, 245, 239, 0.08), 0 20px 40px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: []
};

export default config;