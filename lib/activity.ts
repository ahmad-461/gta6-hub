import { supabase } from "@/lib/supabase"

export type ActivityLogAction = "created" | "updated" | "deleted" | "published" | "archived" | "approved" | "rejected" | "spam"
export type ActivityLogEntityType = "article" | "guide" | "character" | "cheat_code" | "comment" | "map_location" | "lore_topic" | "trailer_breakdown" | "category"

interface LogActivityParams {
  action: ActivityLogAction
  entityType: ActivityLogEntityType
  entityId?: string
  entityTitle?: string
}

export async function logAdminActivity({
  action,
  entityType,
  entityId,
  entityTitle
}: LogActivityParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload: any = {
      actor_id: user.id,
      action,
      entity_type: entityType,
      entity_title: entityTitle || `${entityType} ${action}`,
      created_at: new Date().toISOString()
    }

    if (entityId) {
      payload.entity_id = entityId
    }

    const { error } = await supabase.from("activity_log").insert(payload)
    if (error) {
      console.error("[ACTIVITY_LOG] Failed to insert log row:", error)
    }
  } catch (err) {
    console.error("[ACTIVITY_LOG] Unexpected error logging activity:", err)
  }
}
