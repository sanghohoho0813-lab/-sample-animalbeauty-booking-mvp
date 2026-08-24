import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#F0F7F4",
          100: "#DCEEE7",
          200: "#BCDFD3",
          300: "#8FC9B7",
          400: "#5DAE97",
          500: "#3D9B81",
          600: "#2E8A71",
          700: "#27705D",
          800: "#22594B",
          900: "#1D4A3F",
        },
        coral: {
          50: "#FEF3F0",
          100: "#FDE4DD",
          200: "#FAC8BB",
          300: "#F6A28C",
          400: "#F0805F",
          500: "#E96A47",
          600: "#D6512F",
          700: "#B34026",
        },
        cream: {
          50: "#FCFAF7",
          100: "#F8F4EE",
          200: "#F1EAE0",
          300: "#E5DAC9",
        },
        ink: {
          DEFAULT: "#22332E",
          soft: "#41534C",
          muted: "#6C7D75",
          faint: "#9AA8A1",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "'Helvetica Neue'",
          "'Segoe UI'",
          "'Apple SD Gothic Neo'",
          "'Noto Sans KR'",
          "'Malgun Gothic'",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 12px rgba(34, 51, 46, 0.06)",
        "card-hover": "0 8px 24px rgba(34, 51, 46, 0.10)",
        float: "0 -4px 20px rgba(34, 51, 46, 0.08)",
        cta: "0 6px 16px rgba(61, 155, 129, 0.28)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
        "3.5xl": "1.75rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "pop-check": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.3s ease-out both",
        "fade-in": "fade-in 0.25s ease-out both",
        "scale-in": "scale-in 0.25s ease-out both",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pop-check": "pop-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
