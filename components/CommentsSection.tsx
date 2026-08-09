"use client"

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Send, CheckCircle } from "lucide-react"

interface Comment {
  id: string
  name: string
  content: string
  created_at: string
}

interface CommentsSectionProps {
  articleId: string
  initialComments: Comment[]
}

export default function CommentsSection({ articleId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [pendingComments, setPendingComments] = useState<Comment[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!name.trim() || !email.trim() || !content.trim()) {
      setError("Please fill in all fields.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setSubmitting(true)

    try {
      const newComment = {
        article_id: articleId,
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        status: "pending", // default is pending
      }

      const { data, error: insertError } = await supabase
        .from("comments")
        .insert([newComment])
        .select()

      if (insertError) throw insertError

      // Show success
      setSuccess(true)

      // Keep track of the pending comment locally so the visitor can see their submission!
      if (data && data[0]) {
        setPendingComments((prev) => [data[0], ...prev])
      }

      // Clear input content
      setContent("")
    } catch (err: any) {
      console.error("Comment submission error:", err)
      setError("Failed to submit comment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-card-border pb-3">
        <MessageSquare className="w-5 h-5 text-neon-pink" />
        Discussions ({comments.length + pendingComments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-lg p-6 space-y-4">
        <h4 className="text-sm font-bold tracking-wider text-white uppercase">Leave a Comment</h4>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500 text-rose-500 text-xs px-4 py-2.5 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs px-4 py-2.5 rounded flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Thank you! Your comment has been submitted and is pending moderator approval.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="comment-name" className="block text-xs font-bold text-foreground/60 uppercase mb-1.5">
              Name
            </label>
            <input
              type="text"
              id="comment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full bg-background border border-card-border rounded px-4 py-2 text-sm text-foreground focus:outline-none focus:border-neon-pink transition-colors disabled:opacity-50"
              placeholder="Lucia"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="block text-xs font-bold text-foreground/60 uppercase mb-1.5">
              Email (Will not be published)
            </label>
            <input
              type="email"
              id="comment-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full bg-background border border-card-border rounded px-4 py-2 text-sm text-foreground focus:outline-none focus:border-neon-pink transition-colors disabled:opacity-50"
              placeholder="lucia@vicecity.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="comment-content" className="block text-xs font-bold text-foreground/60 uppercase mb-1.5">
            Comment
          </label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            rows={4}
            className="w-full bg-background border border-card-border rounded px-4 py-2 text-sm text-foreground focus:outline-none focus:border-neon-pink transition-colors resize-none disabled:opacity-50"
            placeholder="What do you think about these news?"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple hover:brightness-110 text-white font-bold text-xs uppercase px-5 py-2.5 rounded transition-all disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Comment"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* List Comments */}
      <div className="space-y-6">
        {pendingComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-card-bg/60 border border-neon-yellow/30 rounded-lg p-5 space-y-2 relative"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">{comment.name}</span>
              <span className="text-[10px] bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow font-black px-2 py-0.5 rounded tracking-wider uppercase">
                Pending Approval
              </span>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed italic">
              {comment.content}
            </p>
          </div>
        ))}

        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-card-bg border border-card-border rounded-lg p-5 space-y-2 hover:border-card-border/80 transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-neon-pink">{comment.name}</span>
              <span className="text-xs text-foreground/40 font-bold">
                {new Date(comment.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {comment.content}
            </p>
          </div>
        ))}

        {comments.length === 0 && pendingComments.length === 0 && (
          <div className="text-center py-8 border border-dashed border-card-border rounded-lg text-foreground/40 text-sm font-medium">
            No comments yet. Start the conversation!
          </div>
        )}
      </div>
    </div>
  )
}
