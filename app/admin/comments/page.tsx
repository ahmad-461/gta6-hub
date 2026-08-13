"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity"
import {
  MessageSquare,
  Check,
  Trash2,
  AlertOctagon,
  Search,
  Loader2,
  Clock,
  CheckSquare,
  Square,
  ArrowUpDown
} from "lucide-react"

export default function CommentModerationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [comments, setComments] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters from URL query params or fallbacks
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "pending")
  const [selectedArticle, setSelectedArticle] = useState(searchParams.get("article") || "")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc")

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchComments()
    fetchArticles()
  }, [])

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedStatus) params.set("status", selectedStatus)
    if (selectedArticle) params.set("article", selectedArticle)
    if (searchQuery) params.set("query", searchQuery)
    if (sortOrder) params.set("sortOrder", sortOrder)

    router.replace(`/admin/comments?${params.toString()}`)
  }, [selectedStatus, selectedArticle, searchQuery, sortOrder, router])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          article_id,
          name,
          email,
          content,
          status,
          created_at,
          anon_id,
          articles (
            title
          )
        `)

      if (error) throw error
      setComments(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load comments.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchArticles = async () => {
    try {
      const { data } = await supabase.from("articles").select("id, title")
      setArticles(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const targetComment = comments.find((c) => c.id === id)

      const { error } = await supabase
        .from("comments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      await logAdminActivity({
        action: newStatus as any,
        entityType: "comment",
        entityId: id,
        entityTitle: `Comment by ${targetComment?.name || "User"}`
      })

      // Award +10 community points if a comment is approved and has an anon_id
      if (newStatus === "approved" && targetComment?.anon_id) {
        try {
          const { data: ptsData } = await supabase
            .from("community_points")
            .select("points")
            .eq("anon_id", targetComment.anon_id)
            .maybeSingle()

          const currentPoints = ptsData?.points || 0
          const updatedPoints = currentPoints + 10

          await supabase
            .from("community_points")
            .upsert({
              anon_id: targetComment.anon_id,
              points: updatedPoints,
              updated_at: new Date().toISOString(),
            }, { onConflict: "anon_id" })

          toast.success("Awarded +10 community points to contributor!")
        } catch (ptsErr) {
          console.warn("Could not award approval points:", ptsErr)
        }
      }

      toast.success(`Comment successfully marked as ${newStatus}!`)
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to moderate comment.")
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this comment?")) return
    try {
      const target = comments.find((c) => c.id === id)
      await logAdminActivity({
        action: "deleted",
        entityType: "comment",
        entityId: id,
        entityTitle: `Comment by ${target?.name || "User"}`
      })

      const { error } = await supabase.from("comments").delete().eq("id", id)
      if (error) throw error
      toast.success("Comment deleted successfully.")
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment.")
    }
  }

  // Bulk Operations
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    try {
      const { error } = await supabase
        .from("comments")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .in("id", selectedIds)

      if (error) throw error

      for (const id of selectedIds) {
        const target = comments.find((c) => c.id === id)
        await logAdminActivity({
          action: "approved",
          entityType: "comment",
          entityId: id,
          entityTitle: `Comment by ${target?.name || "User"}`
        })

        if (target?.anon_id) {
          try {
            const { data: ptsData } = await supabase
              .from("community_points")
              .select("points")
              .eq("anon_id", target.anon_id)
              .maybeSingle()

            const currentPoints = ptsData?.points || 0
            const updatedPoints = currentPoints + 10

            await supabase
              .from("community_points")
              .upsert({
                anon_id: target.anon_id,
                points: updatedPoints,
                updated_at: new Date().toISOString(),
              }, { onConflict: "anon_id" })
          } catch (ptsErr) {
            console.warn("Could not award points for comment:", id, ptsErr)
          }
        }
      }

      toast.success(`Approved ${selectedIds.length} comments & successfully processed community points!`)
      setComments((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: "approved" } : c))
      )
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to approve comments.")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} comments?`)) return
    try {
      for (const id of selectedIds) {
        const target = comments.find((c) => c.id === id)
        await logAdminActivity({
          action: "deleted",
          entityType: "comment",
          entityId: id,
          entityTitle: `Comment by ${target?.name || "User"}`
        })
      }

      const { error } = await supabase.from("comments").delete().in("id", selectedIds)
      if (error) throw error
      toast.success(`Deleted ${selectedIds.length} comments.`)
      setComments((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comments.")
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredComments.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredComments.map((c) => c.id))
    }
  }

  const handleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Filtered & Sorted comments list
  const filteredComments = comments
    .filter((comment) => {
      const matchesStatus = selectedStatus ? comment.status === selectedStatus : true
      const matchesArticle = selectedArticle ? comment.article_id === selectedArticle : true
      const matchesSearch =
        comment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.email.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesArticle && matchesSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="border-b border-[rgba(245,240,250,0.14)] pb-6">
        <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
          Comment Moderation
        </h1>
        <p className="mt-2 text-xs text-[#9C8FAE]">
          Review, approve, reject or flag user comments from public article comment sections.
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded gap-4 flex flex-col md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by commentator name, email or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
          />
        </div>

        {/* Status Select */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setSelectedIds([]) // reset selection
          }}
          className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer font-bold"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="spam">Spam</option>
          <option value="deleted">Deleted (Internal)</option>
        </select>

        {/* Article Select */}
        <select
          value={selectedArticle}
          onChange={(e) => setSelectedArticle(e.target.value)}
          className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer max-w-xs truncate font-bold"
        >
          <option value="">All Articles</option>
          {articles.map((art) => (
            <option key={art.id} value={art.id}>
              {art.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs hover:border-[#FF2E88]/40 transition flex items-center space-x-1"
        >
          <span>Sort Chrono</span>
          <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
        </button>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FF2E88]/10 border border-[#FF2E88]/25 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#FF2E88] font-bold uppercase tracking-wider">
            {selectedIds.length} comments selected
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkApprove}
              className="px-3.5 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black text-[10px] font-bold rounded uppercase tracking-wider transition flex items-center"
            >
              <Check size={14} className="mr-1" /> Approve Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white text-[10px] font-bold rounded uppercase tracking-wider transition flex items-center"
            >
              <Trash2 size={14} className="mr-1" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Comment Feed / List */}
      {isLoading ? (
        <LoadingSkeleton type="table" rows={6} cols={4} />
      ) : filteredComments.length > 0 ? (
        <div className="space-y-4">
          {/* Header Action checkbox */}
          <div className="flex items-center space-x-3 px-4 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-xs font-bold text-[#9C8FAE]/50 uppercase tracking-wider">
            <button onClick={handleSelectAll} className="text-[#9C8FAE]/60 hover:text-white transition">
              {selectedIds.length === filteredComments.length ? (
                <CheckSquare size={18} className="text-[#FF2E88]" />
              ) : (
                <Square size={18} />
              )}
            </button>
            <span>Select All Comments On This Filtered View</span>
          </div>

          <div className="space-y-4">
            {filteredComments.map((comment) => {
              const isSelected = selectedIds.includes(comment.id)
              const articleTitle = comment.articles?.title || "Deleted/Missing Article"

              return (
                <div
                  key={comment.id}
                  className={`bg-[#150C1F] border rounded-xl p-6 transition-all duration-200 flex items-start space-x-4 ${
                    isSelected ? "border-[#FF2E88] bg-[#FF2E88]/5" : "border-[rgba(245,240,250,0.14)] hover:border-white/20"
                  }`}
                >
                  {/* Selector */}
                  <button
                    onClick={() => handleSelectId(comment.id)}
                    className="text-[#9C8FAE]/40 hover:text-white transition flex-shrink-0 mt-1"
                  >
                    {isSelected ? (
                      <CheckSquare size={20} className="text-[#FF2E88]" />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div>
                        <span className="font-bold text-white text-sm">{comment.name}</span>
                        <span className="text-xs text-[#9C8FAE]/40 font-mono ml-2">({comment.email})</span>
                      </div>
                      <span className="text-xs text-[#9C8FAE]/45 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#9C8FAE]/45 italic">
                      on <span className="text-[#00E5FF]">&quot;{articleTitle}&quot;</span>
                    </p>

                    <div className="bg-[#0B0710] border border-[rgba(245,240,250,0.08)] p-4 rounded-lg text-sm text-[#F5F0FA]/80 leading-relaxed break-words">
                      {comment.content}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      {/* Status label */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        comment.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : comment.status === "spam"
                          ? "bg-amber-500/10 text-amber-500"
                          : comment.status === "deleted"
                          ? "bg-white/5 text-[#9C8FAE]"
                          : "bg-[#FF2E88]/10 text-[#FF2E88]"
                      }`}>
                        {comment.status}
                      </span>

                      {/* Comment Action buttons */}
                      <div className="flex items-center space-x-2">
                        {comment.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(comment.id, "approved")}
                            className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold transition border border-emerald-500/20"
                            title="Approve comment"
                          >
                            <Check size={12} className="mr-1" /> Approve
                          </button>
                        )}
                        {comment.status !== "spam" && (
                          <button
                            onClick={() => handleUpdateStatus(comment.id, "spam")}
                            className="inline-flex items-center px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded text-xs font-semibold transition border border-amber-500/20"
                            title="Mark comment as spam"
                          >
                            <AlertOctagon size={12} className="mr-1" /> Mark Spam
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="inline-flex items-center px-2.5 py-1 bg-[#FF2E88]/10 hover:bg-[#FF2E88]/20 text-[#FF2E88] rounded text-xs font-semibold transition border border-[#FF2E88]/20"
                          title="Delete permanently"
                        >
                          <Trash2 size={12} className="mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare size={40} />}
          title="No Comments Found"
          description="Approve or review public article comment boards once readers begin submitting feedback."
        />
      )}
    </div>
  )
}
