import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#071015",
        panel: "#0d1820",
        line: "#18303a",
        neon: "#36f49b",
        electric: "#3db7ff",
        violet: "#9b6bff",
        gold: "#f5c451"
      },
      boxShadow: {
        glow: "0 0 30px rgba(54, 244, 155, 0.18)",
        blue: "0 0 32px rgba(61, 183, 255, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
