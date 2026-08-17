"use server"

import { revalidatePath } from "next/cache"
import { getCategoryConfig } from "@/components/ui/CategoryBadge"

export async function revalidateGuidePathsAction({
  category,
  slug,
  previousCategory,
  previousSlug,
}: {
  category?: string | null
  slug?: string | null
  previousCategory?: string | null
  previousSlug?: string | null
}) {
  try {
    // 1. Revalidate Guides directory root
    revalidatePath("/guides")

    // 2. Revalidate Homepage and other surfaces showing guides
    revalidatePath("/")

    // 3. Revalidate current category path
    if (category) {
      const catConfig = getCategoryConfig(category)
      const catSlug = catConfig ? catConfig.slug : category.toLowerCase().trim().replace(/\s+/g, "-")
      revalidatePath(`/guides/${catSlug}`)
    }

    // 4. Revalidate current guide detail path
    if (category && slug) {
      const catConfig = getCategoryConfig(category)
      const catSlug = catConfig ? catConfig.slug : category.toLowerCase().trim().replace(/\s+/g, "-")
      revalidatePath(`/guides/${catSlug}/${slug}`)
    }

    // 5. Revalidate previous category path if category was changed
    if (previousCategory && previousCategory !== category) {
      const prevCatConfig = getCategoryConfig(previousCategory)
      const prevCatSlug = prevCatConfig ? prevCatConfig.slug : previousCategory.toLowerCase().trim().replace(/\s+/g, "-")
      revalidatePath(`/guides/${prevCatSlug}`)
    }

    // 6. Revalidate previous guide detail path if slug/category was changed
    if (previousCategory && previousSlug && (previousCategory !== category || previousSlug !== slug)) {
      const prevCatConfig = getCategoryConfig(previousCategory)
      const prevCatSlug = prevCatConfig ? prevCatConfig.slug : previousCategory.toLowerCase().trim().replace(/\s+/g, "-")
      revalidatePath(`/guides/${prevCatSlug}/${previousSlug}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("[revalidateGuidePathsAction Error]:", error)
    return { success: false, error: error.message }
  }
}
