import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b12",
        surface: "#16161f",
        accent: "#ff2e63",
        accent2: "#08d9d6",
        muted: "#8a8a99"
      },
      fontFamily: {
        display: ["ui-rounded", "system-ui", "sans-serif"]
      },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-8px)" },
          "40%,80%": { transform: "translateX(8px)" }
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        eq: {
          "0%,100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" }
        }
      },
      animation: {
        shake: "shake 0.45s ease-in-out",
        pop: "pop 0.25s ease-out",
        eq: "eq 0.9s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
export default config;
