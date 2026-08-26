/** @type {import('tailwindcss').Config} */

// Reads a "R, G, B" CSS custom property so the same utility classes
// (bg-base-950, text-base-100, etc.) resolve to different real colors
// depending on the [data-theme] attribute set at runtime — this is what
// makes the Settings > Theme toggle actually repaint the app.
function withOpacityValue(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${varName}))` : `rgba(var(${varName}), ${opacityValue})`;
}

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: withOpacityValue("--color-base-950"),
          900: withOpacityValue("--color-base-900"),
          850: withOpacityValue("--color-base-850"),
          800: withOpacityValue("--color-base-800"),
          700: withOpacityValue("--color-base-700"),
          600: withOpacityValue("--color-base-600"),
          500: withOpacityValue("--color-base-500"),
          400: withOpacityValue("--color-base-400"),
          300: withOpacityValue("--color-base-300"),
          200: withOpacityValue("--color-base-200"),
          100: withOpacityValue("--color-base-100"),
        },
        accent: {
          DEFAULT: "#6D5EF9",
          soft: "#8B7FFA",
          dim: "#4A3FBF",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      },
    },
  },
  plugins: [],
};
