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
        brand: {
          50: "#f0f8ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#8bd0fc",
          400: "#5cb4ee", // Requested Base Maya Sky Blue
          500: "#389ad8",
          600: "#1e7ebd",
          700: "#17649a",
          800: "#16547e",
          900: "#184768",
          950: "#0e2439",
        },
        navy: {
          800: "#1e2c3f",
          850: "#152538",
          900: "#0e2439",
          950: "#081624",
        }
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(15, 23, 42, 0.05), 0 1px 3px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 12px 28px -6px rgba(92, 180, 238, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow-sky': '0 0 18px rgba(92, 180, 238, 0.35)',
        'glow-sky-lg': '0 0 28px rgba(92, 180, 238, 0.45)',
      }
    },
  },
  plugins: [],
};
export default config;
