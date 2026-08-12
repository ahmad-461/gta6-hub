"use server"

import { cookies } from "next/headers"

export async function triggerEmbeddingsGeneration(contentId: string, contentType: "article" | "guide") {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const cookieStore = cookies()

    const response = await fetch(`${baseUrl}/api/embeddings/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieStore.toString()
      },
      body: JSON.stringify({ contentId, contentType }),
      cache: "no-store"
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Embeddings generate API returned error: ${response.status} - ${errorText}`)
      return { success: false, error: `Generate API status: ${response.status}` }
    }

    return await response.json()
  } catch (err: any) {
    console.error("Failed to trigger embeddings generation from server action:", err)
    return { success: false, error: err.message }
  }
}
