import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // FitnessPark — jaune signature
        brand: {
          50: "#fffdf0",
          100: "#fff9c2",
          200: "#fff48a",
          300: "#ffee52",
          400: "#ffe924",
          500: "#ffe500", // jaune FitnessPark
          600: "#e6ce00",
          700: "#b39f00",
          800: "#807200",
          900: "#4d4400"
        },
        ink: "#0a0a0a"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Titres condensés "muscu" facon affiche de salle de sport
        display: ["var(--font-oswald)", "var(--font-inter)", "sans-serif"]
      },
      boxShadow: {
        // ombre dure facon affiche athletique
        hard: "3px 3px 0 #0a0a0a"
      }
    }
  },
  plugins: []
};

export default config;
