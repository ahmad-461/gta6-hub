import React from "react"
import { Compass, BookOpen, Users, Key, Eye, HelpCircle } from "lucide-react"
import Badge from "@/components/ui/Badge"

export interface GuideCategoryBadgeProps {
  category?: string | null
  variant?: "subtle" | "filled" | "outline"
  className?: string
  showIcon?: boolean
}

export function getCategoryConfig(categoryName?: string | null) {
  const norm = (categoryName || "").trim().toLowerCase()

  switch (norm) {
    case "getting started":
    case "getting-started":
      return {
        name: "Getting Started",
        slug: "getting-started",
        icon: Compass,
        color: "green" as const,
      }
    case "story":
      return {
        name: "Story",
        slug: "story",
        icon: BookOpen,
        color: "cyan" as const,
      }
    case "online":
      return {
        name: "Online",
        slug: "online",
        icon: Users,
        color: "violet" as const,
      }
    case "cheats":
      return {
        name: "Cheats",
        slug: "cheats",
        icon: Key,
        color: "yellow" as const,
      }
    case "secrets":
      return {
        name: "Secrets",
        slug: "secrets",
        icon: Eye,
        color: "magenta" as const,
      }
    default:
      return {
        name: categoryName || "Guide",
        slug: (categoryName || "guide").toLowerCase().replace(/\s+/g, "-"),
        icon: HelpCircle,
        color: "gray" as const,
      }
  }
}

export default function GuideCategoryBadge({
  category,
  variant = "subtle",
  className = "",
  showIcon = true,
}: GuideCategoryBadgeProps) {
  const config = getCategoryConfig(category)
  const Icon = config.icon

  return (
    <Badge color={config.color} variant={variant} className={`gap-1.5 ${className}`}>
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{config.name}</span>
    </Badge>
  )
}
