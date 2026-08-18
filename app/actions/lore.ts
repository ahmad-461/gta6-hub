"use server"

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function getLoreTopicsAction() {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("lore_topics")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, topics: data || [] }
  } catch (err: any) {
    console.error("Failed to fetch lore topics:", err)
    return { success: false, error: err.message }
  }
}

export async function saveLoreTopicAction(payload: { id?: string; name: string; type: "location" | "topic"; description?: string }) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { id, name, type, description } = payload

    if (!name || !type) {
      throw new Error("Name and type are required.")
    }

    let resultError
    if (id) {
      const { error } = await supabaseAdmin
        .from("lore_topics")
        .update({ name, type, description })
        .eq("id", id)
      resultError = error
    } else {
      const { error } = await supabaseAdmin
        .from("lore_topics")
        .insert({ name, type, description })
      resultError = error
    }

    if (resultError) throw resultError

    // Automatically rebuild lore connections cache!
    await rebuildLoreConnections(supabaseAdmin)

    revalidatePath("/lore-map")
    return { success: true }
  } catch (err: any) {
    console.error("Failed to save lore topic:", err)
    return { success: false, error: err.message }
  }
}

export async function deleteLoreTopicAction(id: string) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin
      .from("lore_topics")
      .delete()
      .eq("id", id)

    if (error) throw error

    // Automatically rebuild lore connections cache!
    await rebuildLoreConnections(supabaseAdmin)

    revalidatePath("/lore-map")
    return { success: true }
  } catch (err: any) {
    console.error("Failed to delete lore topic:", err)
    return { success: false, error: err.message }
  }
}

export async function rebuildLoreConnectionsAction() {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    await rebuildLoreConnections(supabaseAdmin)
    revalidatePath("/lore-map")
    return { success: true }
  } catch (err: any) {
    console.error("Failed manual rebuild of lore connections:", err)
    return { success: false, error: err.message }
  }
}

// Internal reusable rebuilder
async function rebuildLoreConnections(supabaseAdmin: any) {
  // 1. Fetch published characters
  const { data: characters } = await supabaseAdmin
    .from("characters")
    .select("id, name")
    .eq("status", "published")

  // 2. Fetch active lore topics
  const { data: topics } = await supabaseAdmin
    .from("lore_topics")
    .select("id, name, type")

  // 3. Fetch all published articles
  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select("id, title, content")
    .eq("status", "published")

  if (!characters || !topics || !articles) {
    return
  }

  const allContent = [
    ...(articles || []).map((a: any) => ({ id: a.id, title: a.title, content: a.content, type: "article" }))
  ]

  // Clear previous connections
  await supabaseAdmin
    .from("lore_connections")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")

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
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
