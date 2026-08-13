import React from "react"
import Link from "next/link"
import { ArrowRight, Newspaper, BookOpen, Cpu, Compass } from "lucide-react"

interface SiteDepthIndexProps {
  newsCount: number | null
  guidesCount: number | null
  toolsCount?: number
  loreCount: number | null
}

export default function SiteDepthIndex({
  newsCount,
  guidesCount,
  toolsCount = 5,
  loreCount,
}: SiteDepthIndexProps) {
  const formatCount = (count: number | null) => {
    if (count === null || count === undefined) return "—"
    return count.toString()
  }

  const panels = [
    {
      title: "News & Briefings",
      label: "Latest Intel",
      icon: <Newspaper className="w-5 h-5 text-magenta" />,
      count: formatCount(newsCount),
      suffix: "Articles Published",
      description: "Breaking leaks, updates, and chronological analysis of Rockstar's development cycle.",
      link: "/news",
      colorClass: "hover:border-magenta",
      accentColor: "#FF2D8D",
    },
    {
      title: "Strategy Guides",
      label: "Expert Walkthroughs",
      icon: <BookOpen className="w-5 h-5 text-orange" />,
      count: formatCount(guidesCount),
      suffix: "Guides Available",
      description: "Tactical breakdown of missions, mechanics, and open world secrets in Leonida.",
      link: "/guides",
      colorClass: "hover:border-orange",
      accentColor: "#FF8A3D",
    },
    {
      title: "Interactive Tools",
      label: "Mission Telemetry",
      icon: <Cpu className="w-5 h-5 text-violet" />,
      count: toolsCount.toString(),
      suffix: "Tools Operational",
      description: "Compare vehicle stats, track 100% completion checklist, and run personality matchers.",
      link: "/tools",
      colorClass: "hover:border-violet",
      accentColor: "#832258",
    },
    {
      title: "Lore Connections",
      label: "Knowledge Graph",
      icon: <Compass className="w-5 h-5 text-magenta" />,
      count: formatCount(loreCount),
      suffix: "Mapped Nodes",
      description: "Fully interactive relationship graph mapping co-occurrences of key characters and locations.",
      link: "/lore-map",
      colorClass: "hover:border-magenta",
      accentColor: "#FF2D8D",
    },
  ]

  return (
    <section className="space-y-10 py-12 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[rgba(245,240,250,0.14)] pb-4 gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold font-mono text-orange uppercase tracking-widest">
            Ecosystem Directory
          </span>
          <h3 className="text-3xl sm:text-4xl font-anton uppercase tracking-normal text-paper">
            Site Depth Index
          </h3>
        </div>
        <p className="text-sm text-paper-dim max-w-md font-mono leading-relaxed">
          A real-time, data-backed telemetry of GTA 6 Hub&apos;s current scope and operational modules.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {panels.map((panel, idx) => (
          <div
            key={idx}
            className={`group relative flex flex-col justify-between bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded p-6 transition-all duration-300 ${panel.colorClass} hover:-translate-y-1 shadow-lg`}
          >
            {/* Soft inner glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none rounded"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${panel.accentColor} 0%, transparent 70%)`,
              }}
            />

            <div className="space-y-4 relative z-10">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-paper-dim uppercase tracking-widest">
                  {panel.label}
                </span>
                {panel.icon}
              </div>

              {/* Counts & Suffix */}
              <div className="space-y-1">
                <div className="font-anton text-4xl sm:text-5xl text-paper tracking-tight">
                  {panel.count}
                </div>
                <div className="text-[10px] font-bold font-mono text-paper-dim/60 uppercase tracking-wider">
                  {panel.suffix}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-paper group-hover:text-orange transition-colors">
                  {panel.title}
                </h4>
                <p className="text-xs text-paper-dim leading-relaxed">
                  {panel.description}
                </p>
              </div>
            </div>

            {/* CTA Link at bottom */}
            <div className="pt-6 mt-4 border-t border-[rgba(245,240,250,0.06)] relative z-10">
              <Link
                href={panel.link}
                className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-magenta group-hover:text-orange transition-colors"
              >
                ACCESS MODULE <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
