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
        berlin: {
          blue: {
            DEFAULT: "#1e3a8a",
            light: "#3b82f6",
            dark: "#172554",
          },
          traeger: {
            DEFAULT: "#059669",
            light: "#10b981",
            dark: "#064e3b",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
