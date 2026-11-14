import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blush: { 50: "#fff5f8", 100: "#ffe8f0", 200: "#ffd1e1", 300: "#ffadc8", 400: "#ff85ad", 500: "#f45d92", 600: "#de3f78", 700: "#b82c5f" },
        lavender: { 50: "#f8f5ff", 100: "#efe8ff", 200: "#e0d4ff", 300: "#c9b3ff", 400: "#ad8cfb", 500: "#9268f2", 600: "#7a4ee0" },
        cream: { 50: "#fffdf8", 100: "#fff8ec", 200: "#fdefd6" },
        ink: { DEFAULT: "#3b2a3f", soft: "#6b5a70", faint: "#9d8fa2" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(222, 63, 120, 0.25)",
        card: "0 2px 12px -4px rgba(59, 42, 63, 0.12)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-up": "fade-up .6s ease-out both",
        float: "float 4s ease-in-out infinite",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
