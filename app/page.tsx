import React from "react"
import Link from "next/link"
import { ShieldAlert, Award, FileText, Swords, Wrench } from "lucide-react"

export default function HomePage() {
  const cards = [
    {
      title: "Latest News & Articles",
      description: "Stay up-to-date with standard breaking news, rumors, leaks, and trailer analyses of Grand Theft Auto VI.",
      href: "/news",
      icon: FileText,
      color: "border-neon-pink text-neon-pink hover:bg-neon-pink/10",
    },
    {
      title: "Complete Mission Guides",
      description: "Master every heist, race, collectibles search, and activity with expert-tier walkthroughs and high-detail strategies.",
      href: "/guides",
      icon: Award,
      color: "border-neon-blue text-neon-blue hover:bg-neon-blue/10",
    },
    {
      title: "Meet the Characters",
      description: "Discover background info, voice actors, and deep-dive lore on protagonist duo Lucia, Jason, and the Vice City underground.",
      href: "/characters",
      icon: Swords,
      color: "border-neon-purple text-neon-purple hover:bg-neon-purple/10",
    },
    {
      title: "Verified Cheat Codes",
      description: "Spawn supercars, gain invincibility, change the weather, or get limitless ammo on PS5, Xbox Series X/S, and PC.",
      href: "/cheats",
      icon: ShieldAlert,
      color: "border-neon-yellow text-neon-yellow hover:bg-neon-yellow/10",
    },
    {
      title: "Interactive Fan Tools",
      description: "Access our dynamic map planners, stat generators, and AI tools for an enhanced gaming experience.",
      href: "/tools",
      icon: Wrench,
      color: "border-brand-orange text-brand-orange hover:bg-brand-orange/10",
    },
  ]

  return (
    <div className="flex-grow flex flex-col justify-center">
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-card-bg to-background border-b border-card-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-r from-neon-pink/20 to-neon-blue/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              GTA VI Hub
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your premium fansite portal for Grand Theft Auto 6. Explore upcoming game systems, complete character biographies, expert interactive guides, and multi-platform cheat codes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/news"
              className="px-8 py-3 rounded-md font-bold bg-gradient-to-r from-neon-pink to-neon-purple hover:brightness-110 text-white transition-all duration-300 shadow-lg shadow-neon-pink/25"
            >
              Latest News
            </Link>
            <Link
              href="/cheats"
              className="px-8 py-3 rounded-md font-bold bg-transparent border-2 border-neon-blue hover:bg-neon-blue/10 text-neon-blue transition-all duration-300 shadow-lg shadow-neon-blue/10"
            >
              Cheat Codes
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Explore GTA VI Modules
          </h2>
          <p className="text-foreground/60 max-w-lg mx-auto">
            Our hub provides structured databases connected with real-time Supabase systems for fast and detailed analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`p-6 rounded-lg bg-card-bg border border-card-border hover:border-transparent transition-all duration-300 flex flex-col justify-between group ${card.color}`}
              >
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className="w-8 h-8" />
                    <h3 className="text-lg font-bold text-white group-hover:text-inherit">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>
                <div className="text-sm font-semibold flex items-center space-x-1">
                  <span>Explore Module</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
