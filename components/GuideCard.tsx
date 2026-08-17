import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar } from "lucide-react"
import CategoryBadge from "@/components/ui/CategoryBadge"
import Badge from "@/components/ui/Badge"

export interface GuideCardItem {
  id: string
  title: string
  slug: string
  guide_category: string
  difficulty?: string
  excerpt?: string | null
  featured_image?: string | null
  published_at?: string | null
  updated_at?: string | null
}

interface GuideCardProps {
  guide: GuideCardItem
  categorySlug?: string
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr || ""
  }
}

function getCategorySlug(categoryName: string) {
  return categoryName.toLowerCase().trim().replace(/\s+/g, "-")
}

function getImageUrl(url?: string | null) {
  if (!url) return "/og-image.jpg"
  return url
}

export default function GuideCard({ guide, categorySlug }: GuideCardProps) {
  const catSlug = categorySlug || getCategorySlug(guide.guide_category)
  const href = `/guides/${catSlug}/${guide.slug}`

  const difficultyColor =
    guide.difficulty === "Beginner"
      ? "green"
      : guide.difficulty === "Intermediate"
      ? "yellow"
      : "magenta"

  return (
    <article className="group relative flex flex-col justify-between bg-[#16161B] border border-[rgba(245,245,247,0.14)] rounded-xl overflow-hidden hover:border-[#FF8A3D] hover:shadow-[0_4px_25px_rgba(255,138,61,0.15)] hover:-translate-y-1 transition-all duration-300">
      <div>
        {/* Featured Image with Quality Fix & Hover Zoom */}
        <Link href={href} className="block relative w-full h-48 sm:h-52 overflow-hidden bg-[#0B0B0F]">
          <Image
            src={getImageUrl(guide.featured_image)}
            alt={guide.title}
            fill
            quality={90}
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {/* Card Body Content */}
        <div className="p-5 space-y-3">
          {/* CategoryBadge & Difficulty Badge together */}
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={guide.guide_category} size="sm" variant="subtle" />
            {guide.difficulty && (
              <Badge color={difficultyColor} variant="filled" className="text-[9px]">
                {guide.difficulty}
              </Badge>
            )}
          </div>

          {/* Bold Title */}
          <h2 className="text-lg sm:text-xl font-anton uppercase text-[#F5F5F7] group-hover:text-[#FF8A3D] transition-colors leading-tight line-clamp-2">
            <Link href={href}>{guide.title}</Link>
          </h2>

          {/* One-line excerpt / teaser */}
          {guide.excerpt && (
            <p className="text-xs sm:text-sm text-[#9E9EA8] line-clamp-2 leading-relaxed">
              {guide.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Footer Meta: "Last Verified" date in Space Mono */}
      <div className="p-5 pt-0 mt-2 border-t border-[rgba(245,245,247,0.08)] pt-3 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#9E9EA8]">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#FF8A3D]" />
          <span>Last Verified: {formatDate(guide.updated_at || guide.published_at)}</span>
        </span>
        <Link
          href={href}
          className="text-[#FF8A3D] group-hover:text-[#FF2D8D] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          Read &rarr;
        </Link>
      </div>
    </article>
  )
}
