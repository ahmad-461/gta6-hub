module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0F",
        foreground: "#F5F5F7",
        neon: {
          pink: "#FF2D8D",
          orange: "#FF8A3D",
          purple: "#832258",
          yellow: "#ffd700",
        },
        card: {
          bg: "#16161B",
          border: "rgba(245,245,247,0.14)",
        },
        brand: {
          orange: "#FF8A3D",
          dark: "#0B0B0F",
        },
        // Exact Reference Design Tokens
        ink: "#0B0B0F",
        "ink-2": "#16161B",
        paper: "#F5F5F7",
        "paper-dim": "#9E9EA8",
        magenta: "#FF2D8D",
        orange: "#FF8A3D",
        violet: "#832258",
        hairline: "rgba(245,245,247,0.14)",
      },
      fontFamily: {
        anton: ["var(--font-anton)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
}
