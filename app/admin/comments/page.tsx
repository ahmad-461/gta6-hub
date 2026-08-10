"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  MessageSquare,
  Check,
  Trash2,
  AlertOctagon,
  Search,
  Filter,
  Loader2,
  Clock,
  FolderOpen,
  CheckSquare,
  Square
} from "lucide-react"

export default function CommentModerationPage() {
  const [comments, setComments] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("pending")
  const [selectedArticle, setSelectedArticle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchComments()
    fetchArticles()
  }, [])

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
          articles (
            title
          )
        `)
        .order("created_at", { ascending: false })

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
      const { error } = await supabase
        .from("comments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
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
      toast.success(`Approved ${selectedIds.length} comments!`)
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
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} comments?`)) return
    try {
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

  // Filtered comments list
  const filteredComments = comments.filter((comment) => {
    const matchesStatus = selectedStatus ? comment.status === selectedStatus : true
    const matchesArticle = selectedArticle ? comment.article_id === selectedArticle : true
    const matchesSearch =
      comment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.email.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesArticle && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Comment Moderation
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Review, approve, reject or flag user comments from public article comment sections.
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-card-bg border border-card-border p-5 rounded-xl gap-4 flex flex-col md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by commentator name, email or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
          />
        </div>

        {/* Status Select */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setSelectedIds([]) // reset selection
          }}
          className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none cursor-pointer"
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
          className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none cursor-pointer max-w-xs truncate"
        >
          <option value="">All Articles</option>
          {articles.map((art) => (
            <option key={art.id} value={art.id}>
              {art.title}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="bg-neon-pink/10 border border-neon-pink/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-none">
          <p className="text-sm text-neon-pink font-semibold">
            {selectedIds.length} comments selected
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkApprove}
              className="px-3.5 py-1.5 bg-neon-blue hover:bg-neon-blue/90 text-black text-xs font-bold rounded uppercase transition flex items-center"
            >
              <Check size={14} className="mr-1" /> Approve Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-neon-pink hover:bg-neon-pink/90 text-white text-xs font-bold rounded uppercase transition flex items-center"
            >
              <Trash2 size={14} className="mr-1" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Comment Feed / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredComments.length > 0 ? (
        <div className="space-y-4">
          {/* Header Action checkbox */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-[#110f17] border border-card-border rounded-lg text-xs font-bold text-foreground/50 uppercase tracking-wider">
            <button onClick={handleSelectAll} className="text-foreground/60 hover:text-white transition">
              {selectedIds.length === filteredComments.length ? (
                <CheckSquare size={18} className="text-neon-pink" />
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
                  className={`bg-card-bg border rounded-xl p-6 transition-all duration-200 flex items-start space-x-4 ${
                    isSelected ? "border-neon-pink bg-neon-pink/5" : "border-card-border hover:border-card-border/80"
                  }`}
                >
                  {/* Selector */}
                  <button
                    onClick={() => handleSelectId(comment.id)}
                    className="text-foreground/40 hover:text-white transition flex-shrink-0 mt-1"
                  >
                    {isSelected ? (
                      <CheckSquare size={20} className="text-neon-pink" />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div>
                        <span className="font-bold text-white text-sm">{comment.name}</span>
                        <span className="text-xs text-foreground/40 font-mono ml-2">({comment.email})</span>
                      </div>
                      <span className="text-xs text-foreground/45 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/45 italic">
                      on <span className="text-neon-blue">&quot;{articleTitle}&quot;</span>
                    </p>

                    <div className="bg-[#100e16] border border-card-border/60 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed break-words">
                      {comment.content}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      {/* Status label */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        comment.status === "approved"
                          ? "bg-neon-blue/15 text-neon-blue"
                          : comment.status === "spam"
                          ? "bg-neon-yellow/15 text-neon-yellow"
                          : comment.status === "deleted"
                          ? "bg-foreground/5 text-foreground/40"
                          : "bg-neon-pink/15 text-neon-pink"
                      }`}>
                        {comment.status}
                      </span>

                      {/* Comment Action buttons */}
                      <div className="flex items-center space-x-2">
                        {comment.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(comment.id, "approved")}
                            className="inline-flex items-center px-2.5 py-1 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue rounded text-xs font-semibold transition"
                            title="Approve comment"
                          >
                            <Check size={12} className="mr-1" /> Approve
                          </button>
                        )}
                        {comment.status !== "spam" && (
                          <button
                            onClick={() => handleUpdateStatus(comment.id, "spam")}
                            className="inline-flex items-center px-2.5 py-1 bg-neon-yellow/10 hover:bg-neon-yellow/20 text-neon-yellow rounded text-xs font-semibold transition"
                            title="Mark comment as spam"
                          >
                            <AlertOctagon size={12} className="mr-1" /> Mark Spam
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="inline-flex items-center px-2.5 py-1 bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink rounded text-xs font-semibold transition"
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
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl bg-card-bg/50">
          <MessageSquare size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No comments found matching the filters.</p>
        </div>
      )}
    </div>
  )
}
