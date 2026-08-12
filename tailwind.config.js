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
        },
        // Exact Reference Design Tokens
        ink: "#0B0710",
        "ink-2": "#150C1F",
        paper: "#F5F0FA",
        "paper-dim": "#9C8FAE",
        magenta: "#FF2E88",
        cyan: "#00E5FF",
        violet: "#6C1FB5",
        hairline: "rgba(245,240,250,0.14)",
      },
      fontFamily: {
        anton: ["var(--font-anton)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
}
