"use server"

import { revalidatePath } from "next/cache"

export async function revalidateGuidePathsAction(categorySlug?: string, guideSlug?: string) {
  try {
    revalidatePath("/guides")
    if (categorySlug) {
      revalidatePath(`/guides/${categorySlug}`)
      if (guideSlug) {
        revalidatePath(`/guides/${categorySlug}/${guideSlug}`)
      }
    }
    return { success: true }
  } catch (err: any) {
    console.error("Revalidation error:", err)
    return { success: false, error: err.message }
  }
}
