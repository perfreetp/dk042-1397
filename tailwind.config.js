/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        aviation: {
          50: "#f0f5fa",
          100: "#dce7f1",
          200: "#b8cfe3",
          300: "#8aafd0",
          400: "#5586b8",
          500: "#34659d",
          600: "#275081",
          700: "#1e3a5f",
          800: "#1a314f",
          900: "#172b44",
          950: "#0f1c2e",
        },
        alert: {
          critical: "#c53030",
          warning: "#e86a2c",
          caution: "#d69e2e",
          safe: "#2e7d52",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.35s ease-out forwards",
        "stagger-fade": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(320px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(15, 28, 46, 0.12), 0 1px 3px -1px rgba(15, 28, 46, 0.08)",
        hover: "0 8px 24px -4px rgba(15, 28, 46, 0.18), 0 4px 10px -2px rgba(15, 28, 46, 0.12)",
      },
    },
  },
  plugins: [],
};
