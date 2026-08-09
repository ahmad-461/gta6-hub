import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about the dedicated Grand Theft Auto VI enthusiast team running GTA 6 Hub.",
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">
        About GTA VI Hub
      </h1>
      <p className="text-foreground/80 leading-relaxed mb-6">
        Welcome to the premier unofficial community resource for everything Grand Theft Auto VI. Founded by deep gaming enthusiasts and passionate software developers, our site aims to provide standard, reliable data, interactive tools, and community-driven guides.
      </p>
      <p className="text-foreground/80 leading-relaxed mb-6">
        Our database integrates seamlessly with Supabase real-time clients, empowering us to fetch the latest high-fidelity heists walkthroughs, custom multiplayer tools, map pointers, and dynamic game data instantly.
      </p>
      <div className="p-6 bg-card-bg border border-card-border rounded-lg">
        <h2 className="text-lg font-bold text-white mb-2">Our Mission</h2>
        <p className="text-foreground/60 text-sm">
          To build an open-source, highly modular platform where GTA 6 players worldwide can share, analyze, and optimize their gameplay experiences using cutting edge tools.
        </p>
      </div>
    </div>
  )
}
