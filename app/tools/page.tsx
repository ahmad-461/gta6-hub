import React from "react"
import Link from "next/link"
import {
  GitCompare,
  ShieldAlert,
  Swords,
  Car,
  CheckSquare,
  Wrench,
  ArrowRight,
  Sparkles
} from "lucide-react"

export const metadata = {
  title: "Interactive GTA 6 Fan Tools",
  description: "Advanced interactive fansite tools including side-by-side spec comparison, verified cheat codes, character compatibility quizzes, radar vehicle comparator, and campaign checklists.",
}

const FAN_TOOLS = [
  {
    title: "GTA 5 vs GTA 6 Comparison",
    description: "Compare map sizes, graphics physics, protagonist mechanics, player counts, and key innovations between standard versions of the games.",
    href: "/tools/comparison",
    icon: GitCompare,
    badge: "Database Driven",
    color: "border-neon-pink text-neon-pink hover:bg-neon-pink/[0.04]",
    accent: "text-neon-pink",
    iconBg: "bg-neon-pink/10"
  },
  {
    title: "Cheat Code Finder",
    description: "Instantly search, copy, and filter multi-platform inputs for weapons, vehicles, weather controls, and infinite player capabilities.",
    href: "/tools/cheat-finder",
    icon: ShieldAlert,
    badge: "Supabase Live",
    color: "border-neon-yellow text-neon-yellow hover:bg-neon-yellow/[0.04]",
    accent: "text-neon-yellow",
    iconBg: "bg-neon-yellow/10"
  },
  {
    title: "Character Alter-Ego Quiz",
    description: "Take our 8-question playstyle personality match to identify your GTA 6 criminal alter-ego with dynamic social OG sharing.",
    href: "/tools/which-character",
    icon: Swords,
    badge: "Heuristic Matching",
    color: "border-neon-purple text-neon-purple hover:bg-neon-purple/[0.04]",
    accent: "text-neon-purple",
    iconBg: "bg-neon-purple/10"
  },
  {
    title: "Garage Car Comparator",
    description: "Multi-select up to 3 high-performance vehicles and compare speeds, accelerations, and armors on an interactive Chart.js Radar Chart.",
    href: "/tools/car-compare",
    icon: Car,
    badge: "Chart.js Radar",
    color: "border-neon-blue text-neon-blue hover:bg-neon-blue/[0.04]",
    accent: "text-neon-blue",
    iconBg: "bg-neon-blue/10"
  },
  {
    title: "Story Mission Tracker",
    description: "Organize and track speculative campaign story chapters. Check off missions, monitor average runtimes, and save state to localStorage.",
    href: "/tools/mission-tracker",
    icon: CheckSquare,
    badge: "Local Save",
    color: "border-emerald-500 text-emerald-400 hover:bg-emerald-500/[0.04]",
    accent: "text-emerald-400",
    iconBg: "bg-emerald-500/10"
  }
]

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-card-border pb-8">
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <Wrench className="w-8 h-8 text-neon-pink" />
            <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              Leonida Fan Club
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 text-white uppercase tracking-tight">
            Interactive Fan Tools
          </h1>
          <p className="text-foreground/60 max-w-2xl text-sm sm:text-base leading-relaxed">
            Boost your gameplay with our premium collection of client-side modules. From dynamic vehicle analysis and multi-platform cheat boards to story logs and character quizzes, everything works without registration.
          </p>
        </div>

        <div className="bg-white/5 border border-card-border p-4 rounded-xl flex items-center space-x-3 shrink-0 max-w-sm">
          <Sparkles className="w-5 h-5 text-neon-yellow animate-pulse" />
          <p className="text-xs text-foreground/75 leading-normal">
            No registration required. All interactive trackers utilize instant local storage cache to keep your data saved.
          </p>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FAN_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.title}
              href={tool.href}
              className={`p-6 rounded-xl bg-card-bg/60 backdrop-blur-sm border border-card-border hover:border-transparent transition-all duration-300 flex flex-col justify-between group ${tool.color} hover:shadow-2xl hover:shadow-white/[0.02]`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-lg ${tool.iconBg} ${tool.accent}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/5 text-foreground/50 px-2.5 py-1 rounded">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white mb-2.5 group-hover:text-inherit transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed mb-8">
                  {tool.description}
                </p>
              </div>

              <div className="text-xs font-bold flex items-center space-x-1.5 pt-4 border-t border-card-border/50">
                <span>Launch Tool Module</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
