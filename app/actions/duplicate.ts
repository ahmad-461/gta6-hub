"use server"

import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface DuplicateCheckParams {
  content: string
  ignoreId?: string // ignore current article if editing
}

export async function checkDuplicateSimilarityAction({ content, ignoreId }: DuplicateCheckParams) {
  try {
    const textToEmbed = content.replace(/<[^>]+>/g, " ").trim()
    if (textToEmbed.length < 50) {
      return { isDuplicate: false }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return { isDuplicate: false } // fail-safe if API key is not configured
    }

    // 1. Generate embedding for draft content
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const embRes = await embeddingModel.embedContent(textToEmbed)
    const embeddingValue = embRes.embedding?.values

    if (!embeddingValue || embeddingValue.length !== 768) {
      return { isDuplicate: false }
    }

    // 2. Perform cosine similarity check
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      "match_article_embeddings",
      {
        query_embedding: embeddingValue,
        match_threshold: 0.85, // 0.85 threshold as requested
        match_count: 5
      }
    )

    if (matchError || !matches || matches.length === 0) {
      return { isDuplicate: false }
    }

    // 3. Find the best match that is an article and not the ignored current ID
    const bestMatch = matches.find((m: any) => m.content_id !== ignoreId && m.content_type === "article")

    if (!bestMatch) {
      return { isDuplicate: false }
    }

    // 4. Retrieve matched title and slug
    let title = ""
    let slug = ""

    const { data: article } = await supabaseAdmin
      .from("articles")
      .select("title, slug")
      .eq("id", bestMatch.content_id)
      .single()

    if (article) {
      title = article.title
      slug = article.slug
    }

    if (title && slug) {
      return {
        isDuplicate: true,
        title,
        slug,
        contentType: bestMatch.content_type,
        similarity: bestMatch.similarity
      }
    }

    return { isDuplicate: false }
  } catch (err) {
    console.error("Duplicate similarity check failed:", err)
    return { isDuplicate: false }
  }
}
