import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Simple in-memory session store for rate limits (10 requests per session ID)
// Cleared on server restart, but highly robust for session cookies
const sessionStore = new Map<string, number>()

export async function POST(request: Request) {
  try {
    // 1. Session tracking & Rate limiting (10 requests max per session)
    const cookieStore = cookies()
    let sessionId = cookieStore.get("gta6_chat_session")?.value

    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    const currentCount = sessionStore.get(sessionId) || 0

    if (currentCount >= 10) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can only ask up to 10 questions per session to control Gemini API costs." },
        { status: 429 }
      )
    }

    sessionStore.set(sessionId, currentCount + 1)

    const { question } = await request.json()

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Bad Request: Question is required." },
        { status: 400 }
      )
    }

    // 2. Generate embedding for user question
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" })

    let queryEmbedding: number[]
    try {
      const embRes = await embeddingModel.embedContent(question)
      queryEmbedding = embRes.embedding?.values
    } catch (err: any) {
      console.error("Failed to generate embedding for question:", err)
      return NextResponse.json(
        { error: "Failed to generate query embedding." },
        { status: 500 }
      )
    }

    if (!queryEmbedding || queryEmbedding.length !== 768) {
      return NextResponse.json(
        { error: "Invalid query embedding generated." },
        { status: 500 }
      )
    }

    // 3. Search similarity using pgvector RPC
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      "match_article_embeddings",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.4, // cosine similarity threshold of 0.4 as requested
        match_count: 5
      }
    )

    if (matchError) {
      console.error("Similarity search failed:", matchError)
      return NextResponse.json(
        { error: "Failed to search similarity." },
        { status: 500 }
      )
    }

    // 4. If no matches or top match score is too low, handle gracefully
    if (!matches || matches.length === 0) {
      const response = NextResponse.json({
        answer: "I don't have information about that. Try asking something else related to GTA 6!",
        sources: []
      })
      response.cookies.set("gta6_chat_session", sessionId, { path: "/", maxAge: 60 * 60 * 24 })
      return response
    }

    // Fetch the articles/guides details to build context and links
    const articleIds = matches.filter((m: any) => m.content_type === "article").map((m: any) => m.content_id)
    const guideIds = matches.filter((m: any) => m.content_type === "guide").map((m: any) => m.content_id)

    const articlesMap = new Map<string, { title: string; slug: string }>()
    const guidesMap = new Map<string, { title: string; slug: string; guide_category: string }>()

    if (articleIds.length > 0) {
      const { data: articles } = await supabaseAdmin
        .from("articles")
        .select("id, title, slug")
        .in("id", articleIds)

      articles?.forEach((art: any) => {
        articlesMap.set(art.id, { title: art.title, slug: art.slug })
      })
    }

    if (guideIds.length > 0) {
      const { data: guides } = await supabaseAdmin
        .from("guides")
        .select("id, title, slug, guide_category")
        .in("id", guideIds)

      guides?.forEach((g: any) => {
        guidesMap.set(g.id, { title: g.title, slug: g.slug, guide_category: g.guide_category })
      })
    }

    // 5. Construct Gemini system/user prompt
    const contextSegments = matches.map((m: any) => {
      const source = m.content_type === "article" ? articlesMap.get(m.content_id) : guidesMap.get(m.content_id)
      const path = m.content_type === "article"
        ? `/news/${source?.slug || ""}`
        : `/guides/${encodeURIComponent((source as any)?.guide_category || "Getting Started")}/${source?.slug || ""}`
      return `Source: ${source?.title || "GTA 6 Hub Content"}\nURL: ${path}\nText: ${m.chunk_text}`
    }).join("\n\n---\n\n")

    const systemPrompt = `You are the GTA 6 Hub RAG Assistant. Your job is to answer user questions using the provided source segments.
- You MUST answer questions solely using the facts provided in the source segments.
- If the sources do not contain enough facts to answer, respond exactly with "I don't have information about that." and nothing else. Do not make things up.
- You MUST include inline links to the source articles or guides in markdown format: [Source Title](URL) (e.g. [Lucia Trailer Details](/news/lucia-trailer-breakdown)) where appropriate when referencing information.
- Write in a knowledgeable, friendly tone. Use bold text for emphasis where appropriate, but keep the response concise.`

    const userPrompt = `Context:\n${contextSegments}\n\nQuestion: ${question}`

    // 6. Generate streamed answer from Gemini
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // We can support streaming or resolve directly. Let's do streaming!
    const result = await chatModel.generateContentStream({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ]
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    })

    // Expose similarity and source documents as headers
    const topSimilarity = matches && matches.length > 0 ? (matches[0].similarity ?? 0) : 0
    const uniqueSources: Array<{ title: string; href: string; type: string }> = []
    const processedKeys = new Set<string>()

    matches.forEach((m: any) => {
      const key = `${m.content_type}:${m.content_id}`
      if (processedKeys.has(key)) return
      processedKeys.add(key)

      if (m.content_type === "article") {
        const art = articlesMap.get(m.content_id)
        if (art) {
          uniqueSources.push({
            title: art.title,
            href: `/news/${art.slug}`,
            type: "article"
          })
        }
      } else if (m.content_type === "guide") {
        const gd = guidesMap.get(m.content_id)
        if (gd) {
          uniqueSources.push({
            title: gd.title,
            href: `/guides/${encodeURIComponent(gd.guide_category || "Getting Started")}/${gd.slug}`,
            type: "guide"
          })
        }
      }
    })

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Set-Cookie": `gta6_chat_session=${sessionId}; Path=/; Max-Age=${60 * 60 * 24}`,
        "X-Similarity-Score": topSimilarity.toString(),
        "X-Source-Documents": JSON.stringify(uniqueSources)
      }
    })

    return response
  } catch (error: any) {
    console.error("Embeddings chat route failed:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred during chat inference." },
      { status: 500 }
    )
  }
}
