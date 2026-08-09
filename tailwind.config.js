module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0c10",
        foreground: "#f3f4f6",
        neon: {
          pink: "#ff007f",
          blue: "#00f0ff",
          purple: "#9b51e0",
          yellow: "#ffd700",
        },
        card: {
          bg: "#15131a",
          border: "#25212c",
        },
        brand: {
          orange: "#f97316",
          dark: "#0b0a0e",
        }
      },
    },
  },
  plugins: [],
}
