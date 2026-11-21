/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark theme: deep navy-violet surfaces + vivid accents (one per section).
        brand: { DEFAULT: "#7C7BFF", soft: "#26254D", light: "#C9C8FF", dark: "#4746D0" },
        ink: { 950: "#07070F", 900: "#0B0B17", 850: "#11111F", 800: "#181829", 700: "#222238", 600: "#2E2E4A" },
      },
    },
  },
  plugins: [],
}

