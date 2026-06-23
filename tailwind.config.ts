import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        yellow: { DEFAULT: "hsl(var(--yellow))" },
        ink: { DEFAULT: "hsl(var(--ink))" },
        surface: { DEFAULT: "hsl(var(--surface))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "celebration-pop": {
          "0%": { opacity: "0", transform: "scale(0.85) translateY(12px)" },
          "60%": { opacity: "1", transform: "scale(1.03) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "trophy-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spotlight-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "celebration-pop": "celebration-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "trophy-bounce": "trophy-bounce 1.2s ease-in-out infinite",
        "spotlight-rotate": "spotlight-rotate 8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
