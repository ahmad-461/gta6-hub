"use client"

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Send, CheckCircle2 } from "lucide-react"

interface Comment {
  id: string
  name: string
  content: string
  created_at: string
}

interface ArticleCommentsProps {
  articleId: string
  initialComments: Comment[]
}

export default function ArticleComments({ articleId, initialComments }: ArticleCommentsProps) {
  const [comments] = useState<Comment[]>(initialComments)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccess(false)

    // Client-side validation
    if (!name.trim() || !email.trim() || !content.trim()) {
      setErrorMsg("All fields are required.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.")
      return
    }

    setSubmitting(true)

    try {
      // Retrieve local anonymous community session ID
      let localAnonId = null
      try {
        const { getOrCreateAnonId } = require("@/lib/points")
        localAnonId = getOrCreateAnonId()
      } catch (err) {
        console.warn("Could not retrieve anon session id:", err)
      }

      const { error } = await supabase
        .from("comments")
        .insert({
          article_id: articleId,
          name: name.trim(),
          email: email.trim(),
          content: content.trim(),
          status: "pending",
          anon_id: localAnonId,
        })

      if (error) {
        console.error("Failed to insert comment:", error)
        setErrorMsg("Failed to submit comment. Please try again.")
        return
      }

      setSuccess(true)
      setName("")
      setEmail("")
      setContent("")
    } catch (err) {
      console.error("Comment submit error:", err)
      setErrorMsg("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 border-t border-card-border/60 pt-10">
      <div className="flex items-center gap-2 text-white">
        <MessageSquare className="w-5 h-5 text-neon-pink" />
        <h3 className="text-xl font-black uppercase tracking-wider">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Existing Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((com) => (
            <div
              key={com.id}
              className="p-5 rounded-lg border border-card-border bg-card-bg/40 space-y-2 relative overflow-hidden"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-neon-blue">{com.name}</span>
                <span className="text-foreground/40 font-semibold">
                  {new Date(com.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
                {com.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-foreground/40 text-sm italic">
            No approved comments yet. Be the first to start the discussion!
          </p>
        )}
      </div>

      {/* Leave a Comment Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-card-border bg-card-bg/60 space-y-4 shadow-lg">
        <h4 className="text-sm font-black uppercase tracking-wider text-white">
          Leave a Comment
        </h4>

        {success && (
          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs leading-relaxed font-semibold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Thank you! Your comment has been successfully submitted and is pending admin approval.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="comment-name" className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
              Your Name
            </label>
            <input
              id="comment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Lucia Fan"
              className="w-full bg-background border border-card-border rounded-lg px-3.5 py-2 text-sm text-white placeholder-foreground/30 focus:outline-none focus:border-neon-pink/70 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="comment-email" className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
              Email Address (never shared)
            </label>
            <input
              id="comment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="e.g. lucia@vicecity.com"
              className="w-full bg-background border border-card-border rounded-lg px-3.5 py-2 text-sm text-white placeholder-foreground/30 focus:outline-none focus:border-neon-pink/70 transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="comment-content" className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
            Comment
          </label>
          <textarea
            id="comment-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            placeholder="Type your comment here..."
            className="w-full bg-background border border-card-border rounded-lg px-3.5 py-2 text-sm text-white placeholder-foreground/30 focus:outline-none focus:border-neon-pink/70 transition-all duration-200 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : (
            <>
              Submit Comment <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
