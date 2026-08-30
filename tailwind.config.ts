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
        "ios-dock": "0 14px 40px -4px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.12) inset",
        "ios-card": "0 2px 10px -2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        "ios-fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ios-slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ios-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "ios-pop": {
          "0%": { transform: "scale(0.9)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.08)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        waveform: {
          "0%, 100%": { height: "4px" },
          "50%": { height: "24px" },
        },
        "stage-pulse": {
          "0%, 100%": { borderColor: "rgba(16, 185, 129, 0.4)", boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
          "50%": { borderColor: "rgba(16, 185, 129, 0.9)", boxShadow: "0 0 14px 2px rgba(16, 185, 129, 0.5)" },
        },
      },
      animation: {
        "ios-fade-in": "ios-fade-in 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "ios-slide-up": "ios-slide-up 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "ios-scale-in": "ios-scale-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "ios-pop": "ios-pop 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 1.8s infinite linear",
        "pulse-glow": "pulse-glow 2.5s infinite ease-in-out",
        "radar-sweep": "radar-sweep 3s infinite linear",
        waveform: "waveform 1.2s infinite ease-in-out",
        "stage-pulse": "stage-pulse 1.8s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
