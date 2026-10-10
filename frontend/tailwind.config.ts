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
        primary: {
          DEFAULT: "#0f766e",
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f0fdfa",
          foreground: "#115e59",
        },
        urgent: {
          DEFAULT: "#e11d48",
          soft: "#fff1f2",
        },
        priority: {
          DEFAULT: "#d97706",
          soft: "#fef3c7",
        },
        routine: {
          DEFAULT: "#059669",
          soft: "#ecfdf5",
        },
        border: "#e2e8f0",
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        brand: {
          50: "#f0f8ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#8bd0fc",
          400: "#5cb4ee",
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
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 24px -4px rgba(15, 118, 110, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        'glow-sky': '0 0 18px rgba(92, 180, 238, 0.35)',
        'glow-sky-lg': '0 0 28px rgba(92, 180, 238, 0.45)',
      }
    },
  },
  plugins: [],
};
export default config;
