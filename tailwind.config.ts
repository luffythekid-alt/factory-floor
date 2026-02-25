import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          secondary: "#0d0d14",
          tertiary: "#12121c",
        },
        accent: {
          green: "#00ff88",
          "green-dim": "#00cc6a",
          blue: "#4d7cff",
          purple: "#8b5cf6",
          cyan: "#22d3ee",
          red: "#ff4466",
          yellow: "#fbbf24",
          orange: "#f97316",
          pink: "#f472b6",
        },
        txt: {
          DEFAULT: "#e8e8ed",
          secondary: "#8888a0",
          tertiary: "#55556a",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.04)",
          hover: "rgba(255,255,255,0.08)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
