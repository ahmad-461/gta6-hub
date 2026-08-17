import React from "react"
import Link from "next/link"
import { ArrowRight, Newspaper, Key, Cpu, Compass } from "lucide-react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"

interface SiteDepthIndexProps {
  newsCount: number | null
  cheatsCount?: number | null
  toolsCount?: number
  loreCount: number | null
}

export default function SiteDepthIndex({
  newsCount,
  cheatsCount,
  toolsCount = 5,
  loreCount,
}: SiteDepthIndexProps) {
  const formatCount = (count: number | null | undefined) => {
    if (count === null || count === undefined) return "—"
    return count.toString()
  }

  const panels = [
    {
      title: "News & Briefings",
      label: "Latest Intel",
      icon: <Newspaper className="w-5 h-5 text-[#FF2E88]" />,
      count: formatCount(newsCount),
      suffix: "Articles Published",
      description: "Breaking leaks, updates, and chronological analysis of Rockstar's development cycle.",
      link: "/news",
      accent: "magenta" as const,
    },
    {
      title: "Cheat Codes",
      label: "System Exploits",
      icon: <Key className="w-5 h-5 text-[#00E5FF]" />,
      count: formatCount(cheatsCount),
      suffix: "Codes Cataloged",
      description: "Database of confirmed button combinations, cell phone numbers, and gameplay modifiers.",
      link: "/cheats",
      accent: "cyan" as const,
    },
    {
      title: "Interactive Tools",
      label: "Mission Telemetry",
      icon: <Cpu className="w-5 h-5 text-[#6C1FB5]" />,
      count: toolsCount.toString(),
      suffix: "Tools Operational",
      description: "Compare vehicle stats, track 100% completion checklist, and run personality matchers.",
      link: "/tools",
      accent: "violet" as const,
    },
    {
      title: "Lore Connections",
      label: "Knowledge Graph",
      icon: <Compass className="w-5 h-5 text-[#FF2E88]" />,
      count: formatCount(loreCount),
      suffix: "Mapped Nodes",
      description: "Fully interactive relationship graph mapping co-occurrences of key characters and locations.",
      link: "/lore-map",
      accent: "magenta" as const,
    },
  ]

  return (
    <section className="space-y-10 py-12 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[rgba(245,240,250,0.14)] pb-4 gap-4">
        <div className="space-y-1">
          <Badge color="cyan" variant="subtle">
            Ecosystem Directory
          </Badge>
          <h3 className="text-3xl sm:text-4xl font-anton uppercase tracking-normal text-[#F5F0FA]">
            Site Depth Index
          </h3>
        </div>
        <p className="text-sm text-[#9C8FAE] max-w-md font-mono leading-relaxed">
          A real-time, data-backed telemetry of GTA 6 Hub&apos;s current scope and operational modules.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {panels.map((panel, idx) => (
          <Card
            key={idx}
            interactive
            hoverGlow={panel.accent}
            variant="standard"
            padding="md"
            className="flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <Badge color={panel.accent} variant="outline">
                  {panel.label}
                </Badge>
                {panel.icon}
              </div>

              {/* Counts & Suffix */}
              <div className="space-y-1">
                <div className="font-anton text-4xl sm:text-5xl text-[#F5F0FA] tracking-tight">
                  {panel.count}
                </div>
                <div className="text-[10px] font-bold font-mono text-[#9C8FAE]/60 uppercase tracking-wider">
                  {panel.suffix}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[#F5F0FA] group-hover:text-cyan transition-colors">
                  {panel.title}
                </h4>
                <p className="text-xs text-[#9C8FAE] leading-relaxed">
                  {panel.description}
                </p>
              </div>
            </div>

            {/* CTA Link at bottom */}
            <div className="pt-6 mt-4 border-t border-[rgba(245,240,250,0.06)]">
              <Link
                href={panel.link}
                className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-[#FF2E88] hover:text-[#00E5FF] transition-colors"
              >
                ACCESS MODULE <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
