"use server"

import { revalidatePath } from "next/cache"

export async function revalidateArticlePathsAction({
  slug,
  previousSlug,
}: {
  slug?: string | null
  previousSlug?: string | null
}) {
  try {
    // 1. Revalidate News directory root
    revalidatePath("/news")

    // 2. Revalidate Homepage, Intelligence, and Timeline surfaces displaying news/rumors
    revalidatePath("/")
    revalidatePath("/intelligence")
    revalidatePath("/timeline")

    // 3. Revalidate current article detail path
    if (slug) {
      revalidatePath(`/news/${slug}`)
    }

    // 4. Revalidate previous article detail path if slug changed
    if (previousSlug && previousSlug !== slug) {
      revalidatePath(`/news/${previousSlug}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("[revalidateArticlePathsAction Error]:", error)
    return { success: false, error: error.message }
  }
}
