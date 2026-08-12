import { NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    // 1. Authenticate and check role (admin/editor)
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Editors and admins only." },
        { status: 403 }
      )
    }

    const { contentId, contentType } = await request.json()

    if (!contentId || !contentType || !["article", "guide"].includes(contentType)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid parameters" },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdminClient()

    // 2. Fetch the content to see if it is published
    let content = ""
    let title = ""
    let isPublished = false

    if (contentType === "article") {
      const { data: article } = await supabaseAdmin
        .from("articles")
        .select("content, title, status")
        .eq("id", contentId)
        .single()

      if (article) {
        content = article.content || ""
        title = article.title || ""
        isPublished = article.status === "published"
      }
    } else {
      const { data: guide } = await supabaseAdmin
        .from("guides")
        .select("content, title, status")
        .eq("id", contentId)
        .single()

      if (guide) {
        content = guide.content || ""
        title = guide.title || ""
        isPublished = guide.status === "published"
      }
    }

    // Always delete previous chunks for this content
    await supabaseAdmin
      .from("article_embeddings")
      .delete()
      .eq("content_id", contentId)

    // If not published, do not generate new embeddings. Rebuild lore cache anyway and return.
    if (!isPublished) {
      await rebuildLoreConnections(supabaseAdmin)
      return NextResponse.json({ success: true, message: "Unpublished. Cleaned embeddings." })
    }

    // 3. Chunking the text by paragraph/double-newline boundaries
    const rawParagraphs = content
      .split(/<\/p>|<br\s*\/?>|\n\n|\r\n\r\n/i)
      .map(p => p.replace(/<[^>]+>/g, " ").trim()) // remove HTML tags
      .filter(p => p.length > 0)

    const chunks: string[] = []
    let currentParagraphs: string[] = []
    let currentWordCount = 0

    for (const p of rawParagraphs) {
      const words = p.split(/\s+/).filter(Boolean).length
      if (words === 0) continue

      if (currentWordCount + words > 500 && currentParagraphs.length > 0) {
        // save chunk
        chunks.push(currentParagraphs.join("\n\n"))
        currentParagraphs = [p]
        currentWordCount = words
      } else {
        currentParagraphs.push(p)
        currentWordCount += words
      }
    }
    if (currentParagraphs.length > 0) {
      chunks.push(currentParagraphs.join("\n\n"))
    }

    // If chunks are empty, but we have some text, just push the original text
    if (chunks.length === 0 && content.replace(/<[^>]+>/g, " ").trim().length > 0) {
      chunks.push(content.replace(/<[^>]+>/g, " ").trim())
    }

    // 4. Generate Embeddings using text-embedding-004
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error("Gemini API key is missing on server.")
    } else if (chunks.length > 0) {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" })

      for (const chunk of chunks) {
        try {
          const res = await model.embedContent(chunk)
          const embeddingValue = res.embedding?.values
          if (embeddingValue && embeddingValue.length === 768) {
            await supabaseAdmin
              .from("article_embeddings")
              .insert({
                content_id: contentId,
                content_type: contentType,
                chunk_text: chunk,
                embedding: embeddingValue
              })
          }
        } catch (err) {
          console.error("Failed to generate embedding for chunk:", err)
        }
      }
    }

    // 5. Recompute Lore Connections (Co-occurrence caching)
    await rebuildLoreConnections(supabaseAdmin)

    return NextResponse.json({
      success: true,
      chunks_generated: chunks.length,
      message: "Successfully synchronized content embeddings and updated lore map."
    })
  } catch (error: any) {
    console.error("Embeddings generate handler failed:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Embedding generation failed." },
      { status: 500 }
    )
  }
}

// Function to rebuild lore connections from published content
async function rebuildLoreConnections(supabaseAdmin: any) {
  try {
    // 1. Fetch published characters
    const { data: characters } = await supabaseAdmin
      .from("characters")
      .select("id, name")
      .eq("status", "published")

    // 2. Fetch active lore topics
    const { data: topics } = await supabaseAdmin
      .from("lore_topics")
      .select("id, name, type")

    // 3. Fetch all published articles and guides
    const { data: articles } = await supabaseAdmin
      .from("articles")
      .select("id, title, content")
      .eq("status", "published")

    const { data: guides } = await supabaseAdmin
      .from("guides")
      .select("id, title, content")
      .eq("status", "published")

    if (!characters || !topics || (!articles && !guides)) {
      return
    }

    const allContent = [
      ...(articles || []).map((a: any) => ({ id: a.id, title: a.title, content: a.content, type: "article" })),
      ...(guides || []).map((g: any) => ({ id: g.id, title: g.title, content: g.content, type: "guide" }))
    ]

    // Clear previous connections
    await supabaseAdmin
      .from("lore_connections")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // clean delete all

    // Compute connections between characters and lore topics
    const connectionsMap = new Map<string, { sourceId: string, sourceType: string, targetId: string, targetType: string, articleIds: Set<string> }>()

    for (const char of characters) {
      for (const topic of topics) {
        const articleIds = new Set<string>()

        for (const item of allContent) {
          const combinedText = `${item.title} ${item.content}`.toLowerCase()
          const charName = char.name.toLowerCase()
          const topicName = topic.name.toLowerCase()

          // Simple word/phrase boundaries check
          const charPattern = new RegExp(`\\b${escapeRegExp(charName)}\\b`, "i")
          const topicPattern = new RegExp(`\\b${escapeRegExp(topicName)}\\b`, "i")

          if (charPattern.test(combinedText) && topicPattern.test(combinedText)) {
            articleIds.add(item.id)
          }
        }

        if (articleIds.size > 0) {
          const key = `${char.id}_${topic.id}`
          connectionsMap.set(key, {
            sourceId: char.id,
            sourceType: "character",
            targetId: topic.id,
            targetType: "topic",
            articleIds
          })
        }
      }
    }

    // Insert connections to db
    if (connectionsMap.size > 0) {
      const inserts = Array.from(connectionsMap.values()).map(conn => ({
        source_id: conn.sourceId,
        source_type: conn.sourceType,
        target_id: conn.targetId,
        target_type: conn.targetType,
        article_ids: Array.from(conn.articleIds)
      }))

      await supabaseAdmin
        .from("lore_connections")
        .insert(inserts)
    }
  } catch (err) {
    console.error("Failed to rebuild lore connections:", err)
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
