import React from "react"
import { Compass, BookOpen, Users, Key, Eye, HelpCircle } from "lucide-react"

export type CategoryType = "Getting Started" | "Story" | "Online" | "Cheats" | "Secrets" | string

interface CategoryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  category: CategoryType
  size?: "sm" | "md" | "lg"
  variant?: "subtle" | "outline" | "filled"
  showIcon?: boolean
}

export const CATEGORY_CONFIGS: Record<
  string,
  {
    name: string
    slug: string
    icon: React.ElementType
    colorClass: string
    borderClass: string
    bgClass: string
    textClass: string
    description: string
  }
> = {
  "getting-started": {
    name: "Getting Started",
    slug: "getting-started",
    icon: Compass,
    colorClass: "emerald",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    description: "Essential tips, controller setups, and rookie advice to survive the Leonida streets.",
  },
  story: {
    name: "Story",
    slug: "story",
    icon: BookOpen,
    colorClass: "blue",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    description: "Full walkthroughs of Lucia and Jason's main heists, side missions, and optional events.",
  },
  online: {
    name: "Online",
    slug: "online",
    icon: Users,
    colorClass: "purple",
    borderClass: "border-purple-500/30",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    description: "Cooperative jobs guides, multiplayer business setups, rankings, and crew strategies.",
  },
  cheats: {
    name: "Cheats",
    slug: "cheats",
    icon: Key,
    colorClass: "amber",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    description: "Detailed input directories and spawn mechanics for PS5, Xbox Series X/S, and PC.",
  },
  secrets: {
    name: "Secrets",
    slug: "secrets",
    icon: Eye,
    colorClass: "rose",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    description: "Collectible item locations, unique vehicle spawns, and Easter eggs hidden across Leonida.",
  },
}

export function getCategoryConfig(categoryOrSlug?: string) {
  if (!categoryOrSlug) return null
  const normalized = categoryOrSlug.toLowerCase().trim().replace(/\s+/g, "-")
  if (CATEGORY_CONFIGS[normalized]) {
    return CATEGORY_CONFIGS[normalized]
  }
  // Fallback search by category name
  const foundKey = Object.keys(CATEGORY_CONFIGS).find(
    (key) => CATEGORY_CONFIGS[key].name.toLowerCase() === categoryOrSlug.toLowerCase().trim()
  )
  if (foundKey) {
    return CATEGORY_CONFIGS[foundKey]
  }
  return null
}

export default function CategoryBadge({
  category,
  size = "sm",
  variant = "subtle",
  showIcon = true,
  className = "",
  ...props
}: CategoryBadgeProps) {
  const config = getCategoryConfig(category)

  const IconComponent = config ? config.icon : HelpCircle
  const categoryName = config ? config.name : category

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }

  let styleClasses = ""
  if (config) {
    if (variant === "filled") {
      styleClasses = `bg-${config.colorClass}-500 text-white border-${config.colorClass}-500`
    } else if (variant === "outline") {
      styleClasses = `bg-transparent ${config.textClass} ${config.borderClass}`
    } else {
      // subtle
      styleClasses = `${config.bgClass} ${config.textClass} ${config.borderClass}`
    }
  } else {
    styleClasses = "bg-[#FF2D8D]/10 text-[#FF2D8D] border-[#FF2D8D]/20"
  }

  return (
    <span
      className={`inline-flex items-center rounded font-mono font-bold uppercase tracking-wider border transition-all duration-150 ${sizeStyles[size]} ${styleClasses} ${className}`}
      {...props}
    >
      {showIcon && <IconComponent className={`${iconSizes[size]} flex-shrink-0`} />}
      <span>{categoryName}</span>
    </span>
  )
}
