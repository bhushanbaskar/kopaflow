import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        panel: "var(--panel)",
        "panel-subtle": "var(--panel-subtle)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        operational: {
          DEFAULT: "#059669", // emerald-600
          bg: "#f0fdf4",
          border: "rgba(5, 150, 105, 0.25)",
        },
        warning: {
          DEFAULT: "#d97706", // amber-600
          bg: "#fffbeb",
          border: "rgba(217, 119, 6, 0.25)",
        },
        critical: {
          DEFAULT: "#dc2626", // red-600
          bg: "#fef2f2",
          border: "rgba(220, 38, 38, 0.25)",
        },
        info: {
          DEFAULT: "#2563eb", // blue-600
          bg: "#eff6ff",
          border: "rgba(37, 99, 235, 0.25)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        pixel: [
          "var(--font-geist-pixel)",
          "var(--font-geist-mono)",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
        xs: "6px",
        sm: "10px",
        DEFAULT: "12px",
        md: "14px",
        lg: "18px",
        xl: "22px",
        "2xl": "26px",
        "3xl": "30px",
        "4xl": "36px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.03)",
        DEFAULT: "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)",
        md: "0 4px 14px -3px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.04)",
        lg: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        xl: "0 20px 35px -8px rgba(0, 0, 0, 0.12), 0 10px 15px -5px rgba(0, 0, 0, 0.06)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        floating: "0 12px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
