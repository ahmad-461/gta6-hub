import { MetadataRoute } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"

  const staticPages = [
    "",
    "/about",
    "/privacy",
    "/contact",
    "/news",
    "/guides",
    "/characters",
    "/cheats",
    "/tools"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.7,
  }))

  try {
    const supabase = createSupabaseServerClient()

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("status", "published")

    const { data: guides } = await supabase
      .from("guides")
      .select("slug, updated_at, guide_category")
      .eq("status", "published")

    const { data: characters } = await supabase
      .from("characters")
      .select("slug, updated_at")
      .eq("status", "published")

    const dynamicPages: Array<{
      url: string
      lastModified: string
      changeFrequency: "daily" | "weekly"
      priority: number
    }> = []

    if (articles && articles.length > 0) {
      articles.forEach((item: { slug: string; updated_at?: string }) => {
        dynamicPages.push({
          url: `${baseUrl}/news/${item.slug}`,
          lastModified: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString(),
          changeFrequency: "daily",
          priority: 0.8,
        })
      })
    }

    if (guides && guides.length > 0) {
      guides.forEach((item: { slug: string; updated_at?: string; guide_category?: string }) => {
        const catSlug = (item.guide_category || "Getting Started").toLowerCase().replace(/\s+/g, "-")
        dynamicPages.push({
          url: `${baseUrl}/guides/${catSlug}/${item.slug}`,
          lastModified: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.8,
        })
      })
    }

    if (characters && characters.length > 0) {
      characters.forEach((item: { slug: string; updated_at?: string }) => {
        dynamicPages.push({
          url: `${baseUrl}/characters/${item.slug}`,
          lastModified: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.6,
        })
      })
    }

    return [...staticPages, ...dynamicPages]
  } catch (error) {
    return staticPages
  }
}
