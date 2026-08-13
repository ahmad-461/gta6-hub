"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { logAdminActivity } from "@/lib/activity"
import NextImage from "next/image"
import { z } from "zod"
import { toast } from "sonner"
import TiptapEditor from "@/components/TiptapEditor"
import {
  Save,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Clock,
  FileText,
  Loader2,
  Trash,
  Tag,
  X,
  Sparkles,
  AlertTriangle
} from "lucide-react"
import { generateAIDraftAction } from "@/app/actions/draft"
import { checkDuplicateSimilarityAction } from "@/app/actions/duplicate"
import { triggerEmbeddingsGeneration } from "@/app/actions/publish"

// Zod Schema for Article Form
const articleSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  excerpt: z.string().max(150, { message: "Excerpt must be max 150 characters" }).optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featuredImage: z.string().optional(),
  rumorStatus: z.string().nullable().optional(),
})

interface ArticleEditorFormProps {
  articleId?: string
}

export default function ArticleEditorForm({ articleId }: ArticleEditorFormProps) {
  const router = useRouter()
  const isEditing = !!articleId

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  // AI Draft & Duplicate Warnings State
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false)
  const [aiNotes, setAiNotes] = useState("")
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{ title: string; slug: string; contentType: string } | null>(null)

  // Form Fields State
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [publishedAt, setPublishedAt] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [rumorStatus, setRumorStatus] = useState<string | null>(null)

  // Tags State
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // Media Picker inside the Editor
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (isEditing) {
      fetchArticleData()
    }
  }, [articleId])

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!isEditing) {
      setSlug(slugify(val))
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("id, name")
      if (!error) setCategories(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchArticleData = async () => {
    try {
      // Fetch article info
      const { data: article, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", articleId)
        .single()

      if (error) {
        toast.error("Failed to load article details.")
        router.push("/admin/articles")
        return
      }

      setTitle(article.title)
      setSlug(article.slug)
      setContent(article.content)
      setExcerpt(article.excerpt || "")
      setCategory(article.category || "")
      setStatus(article.status || "draft")
      setFeaturedImage(article.featured_image || "")
      setSeoTitle(article.seo_title || "")
      setSeoDescription(article.seo_description || "")
      setRumorStatus(article.rumor_status || null)

      if (article.published_at) {
        // Format ISO date string to datetime-local compatible format
        const dateObj = new Date(article.published_at)
        const offset = dateObj.getTimezoneOffset()
        const localDate = new Date(dateObj.getTime() - offset * 60 * 1000)
        setPublishedAt(localDate.toISOString().slice(0, 16))
      }

      // Fetch article tags
      const { data: articleTags } = await supabase
        .from("article_tags")
        .select("tags(name)")
        .eq("article_id", articleId)

      if (articleTags) {
        const loadedTags = articleTags
          .map((at: any) => at.tags?.name)
          .filter(Boolean) as string[]
        setTags(loadedTags)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMedia = async () => {
    setIsLoadingMedia(true)
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("uploaded_at", { ascending: false })

      if (!error) setMediaList(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingMedia(false)
    }
  }

  const handleSelectFeaturedImage = (url: string) => {
    setFeaturedImage(url)
    setIsMediaModalOpen(false)
    toast.success("Featured image selected!")
  }

  // Tags input functions
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove))
  }

  // Live Word Count & Read Time estimator
  const textOnly = content.replace(/<[^>]*>/g, " ").trim()
  const wordCount = textOnly.split(/\s+/).filter(Boolean).length
  const readTime = Math.ceil(wordCount / 200)

  // Ref to prevent keyboard shortcut stale closure issues
  const handleSaveRef = useRef<any>(null)

  // Submit Handler
  const handleSave = async (e?: React.FormEvent, statusOverride?: "draft" | "published" | "archived") => {
    if (e) e.preventDefault()
    setIsSaving(true)

    const targetStatus = statusOverride || status

    // Run background similarity duplicate check on save
    if (!duplicateWarning) {
      const dupCheck = await checkDuplicateSimilarityAction({ content, ignoreId: articleId })
      if (dupCheck.isDuplicate) {
        setDuplicateWarning({
          title: dupCheck.title || "",
          slug: dupCheck.slug || "",
          contentType: dupCheck.contentType || ""
        })
        toast.warning("Similarity Warning: High resemblance to an existing page. Review before proceeding.")
        setIsSaving(false)
        return // non-blocking check: pause save once to show warning. If they click save again, warning is set and it proceeds.
      }
    }

    // Form data format for validation
    const formData = {
      title,
      slug,
      content,
      excerpt,
      category,
      status: targetStatus,
      publishedAt: publishedAt || undefined,
      seoTitle: seoTitle || undefined,
      featuredImage: featuredImage || undefined,
      rumorStatus: rumorStatus,
    }

    const validation = articleSchema.safeParse(formData)
    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        toast.error(`${err.path.join(".")}: ${err.message}`)
      })
      setIsSaving(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const authorId = user?.id

      const savePayload: any = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        category: category || null,
        status: targetStatus,
        featured_image: featuredImage || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : (targetStatus === "published" ? new Date().toISOString() : null),
        author_id: authorId,
        updated_at: new Date().toISOString(),
        rumor_status: rumorStatus || null,
      }

      let savedArticleId = articleId

      if (isEditing) {
        const { error } = await supabase
          .from("articles")
          .update(savePayload)
          .eq("id", articleId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert({
            ...savePayload,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (error) throw error
        savedArticleId = data.id
      }

      // Synchronize Tags
      if (savedArticleId) {
        // 1. Process tags
        const tagIds: string[] = []
        for (const tagName of tags) {
          const tagSlug = slugify(tagName)
          const { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("slug", tagSlug)
            .single()

          if (existingTag) {
            tagIds.push(existingTag.id)
          } else {
            const { data: newTag, error: tagErr } = await supabase
              .from("tags")
              .insert({ name: tagName, slug: tagSlug })
              .select("id")
              .single()

            if (!tagErr && newTag) {
              tagIds.push(newTag.id)
            }
          }
        }

        // 2. Clear old links and establish new ones
        await supabase.from("article_tags").delete().eq("article_id", savedArticleId)

        if (tagIds.length > 0) {
          const links = tagIds.map((tid) => ({
            article_id: savedArticleId,
            tag_id: tid,
          }))
          await supabase.from("article_tags").insert(links)
        }
      }

      // Log audit trail action
      if (savedArticleId) {
        await logAdminActivity({
          action: isEditing ? "updated" : "created",
          entityType: "article",
          entityId: savedArticleId,
          entityTitle: title
        })
      }

      toast.success(isEditing ? "Article updated successfully!" : "Article published/created successfully!")

      // Trigger embeddings generation via server action
      if (savedArticleId) {
        try {
          await triggerEmbeddingsGeneration(savedArticleId, "article")
        } catch (embErr) {
          console.error("Embeddings trigger error:", embErr)
        }
      }

      router.push("/admin/articles")
    } catch (err: any) {
      toast.error(err.message || "Failed to save article.")
    } finally {
      setIsSaving(false)
    }
  }

  // Update handleSaveRef
  handleSaveRef.current = handleSave

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S -> Save Draft
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        toast.info("Saving draft via keyboard shortcut...")
        handleSaveRef.current?.(undefined, "draft")
      }

      // Cmd+Enter or Ctrl+Enter -> Publish
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        toast.info("Publishing via keyboard shortcut...")
        handleSaveRef.current?.(undefined, "published")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono">
        <Loader2 className="animate-spin text-[#00E5FF] h-8 w-8" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 font-mono">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push("/admin/articles")}
            className="p-2 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded hover:bg-[#0B0710] transition text-[#9C8FAE] hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-normal text-white sm:text-3xl font-anton uppercase tracking-wider">
              {isEditing ? "Edit Article" : "New Article"}
            </h1>
            <p className="text-xs text-[#9C8FAE] mt-0.5">
              {isEditing ? `Article ID: ${articleId}` : "Drafting a new news update"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {isEditing ? "Update Article" : "Save & Publish"}
        </button>
      </div>

      {duplicateWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded flex items-start justify-between text-amber-400">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase">Semantic Duplicate Detected (Similarity Check)</h4>
              <p className="text-xs text-[#9C8FAE] mt-1">
                This draft looks extremely similar to the existing {duplicateWarning.contentType}: <strong>{duplicateWarning.title}</strong>. Review to ensure uniqueness.
              </p>
              <a
                href={duplicateWarning.contentType === "article" ? `/news/${duplicateWarning.slug}` : `/guides/${duplicateWarning.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-[#FF2E88] font-bold hover:underline mt-2"
              >
                Open and compare original article &rarr;
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateWarning(null)}
            className="text-[#9C8FAE] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main content column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Draft Assistant Panel */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <button
              type="button"
              onClick={() => setIsAiDraftOpen(!isAiDraftOpen)}
              className="w-full flex items-center justify-between font-bold text-white text-xs uppercase tracking-wider"
            >
              <span className="flex items-center text-[#FF2E88]">
                <Sparkles size={16} className="mr-2" /> AI Draft Assistant
              </span>
              <span className="text-[10px] text-[#9C8FAE]">{isAiDraftOpen ? "Collapse [-]" : "Expand [+]"}</span>
            </button>

            {isAiDraftOpen && (
              <div className="space-y-4 pt-4 border-t border-[rgba(245,240,250,0.08)]">
                <p className="text-xs text-[#9C8FAE]">
                  Paste your raw notes, leaked bulletin texts, or bullet points. The assistant will format a high-quality rich-text draft matching our brand style.
                </p>
                <textarea
                  placeholder="Paste your raw trailer descriptions, bulletin notes, leak lists here..."
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs min-h-[100px]"
                />
                <button
                  type="button"
                  disabled={isGeneratingDraft || !aiNotes.trim()}
                  onClick={async () => {
                    setIsGeneratingDraft(true)
                    const res = await generateAIDraftAction({
                      notes: aiNotes,
                      contentType: "article",
                      categoryName: categories.find(c => c.id === category)?.name
                    })
                    setIsGeneratingDraft(false)
                    if (res.success && res.html) {
                      setContent(res.html)
                      toast.success("Draft generated successfully and loaded into Tiptap!")
                    } else {
                      toast.error(res.error || "Failed to generate draft.")
                    }
                  }}
                  className="w-full py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white text-xs font-bold rounded uppercase tracking-wider transition disabled:opacity-40 flex items-center justify-center space-x-1.5"
                >
                  {isGeneratingDraft ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Drafting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Generate Draft</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Title & Slug */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] uppercase tracking-wider mb-1.5">Article Title</label>
              <input
                type="text"
                required
                placeholder="Enter article title..."
                value={title}
                onChange={handleTitleChange}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] uppercase tracking-wider mb-1.5">Slug URL</label>
              <div className="flex rounded shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-[rgba(245,240,250,0.14)] bg-[#0B0710] text-[#9C8FAE]/45 text-xs font-mono">
                  /news/
                </span>
                <input
                  type="text"
                  required
                  placeholder="article-slug-url"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="block w-full px-3.5 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded-r text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-3">
            <label className="block text-xs font-semibold text-white uppercase tracking-wider">Main Article Content</label>
            <TiptapEditor content={content} onChange={setContent} />
            {/* Editor Footer: Word count & read estimator */}
            <div className="flex items-center justify-between text-[10px] text-[#9C8FAE]/45 pt-2 border-t border-[rgba(245,240,250,0.14)] px-1 font-mono">
              <span className="flex items-center">
                <FileText size={14} className="mr-1" /> {wordCount} Words
              </span>
              <span className="flex items-center">
                <Clock size={14} className="mr-1" /> Estimated {readTime} min read
              </span>
            </div>
          </div>

          {/* Excerpt with live counter */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-[#9C8FAE] uppercase tracking-wider">Article Excerpt</label>
              <span className={`text-[10px] font-mono ${excerpt.length > 150 ? "text-[#FF2E88]" : "text-[#9C8FAE]/40"}`}>
                {excerpt.length}/150 Chars
              </span>
            </div>
            <textarea
              placeholder="Provide a concise teaser excerpt for card summaries (max 150 characters)..."
              value={excerpt}
              maxLength={180}
              onChange={(e) => setExcerpt(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs min-h-[80px]"
            />
          </div>

          {/* SEO Panel */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Search Engine Optimization (SEO)</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Custom Meta Title</label>
                <input
                  type="text"
                  placeholder="Defaults to article title if empty..."
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/45 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Custom Meta Description</label>
                <textarea
                  placeholder="Defaults to excerpt if empty..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/45 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar metadata column */}
        <div className="space-y-6">
          {/* Status, Publishing Time */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Publishing & Rumor</h2>

            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase tracking-wider">Rumor Tracker Class</label>
              <select
                value={rumorStatus || ""}
                onChange={(e) => setRumorStatus(e.target.value || null)}
                className="w-full px-3 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF] cursor-pointer font-semibold mb-4"
              >
                <option value="">Standard News Piece (No Rumor Status)</option>
                <option value="rumor">Rumor (Yellow Status)</option>
                <option value="confirmed">Confirmed (Green Status)</option>
                <option value="debunked">Debunked (Red Status)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase tracking-wider">Visibility Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF] cursor-pointer font-semibold"
              >
                <option value="draft">Draft</option>
                <option value="published">Published / Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {status === "published" && (
              <div>
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 flex items-center uppercase tracking-wider">
                  <Calendar size={14} className="mr-1 text-[#00E5FF]" />
                  Publish Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                />
                <p className="text-[10px] text-[#9C8FAE]/40 mt-1 font-mono">
                  Leave blank to publish instantly, or set a future date to schedule.
                </p>
              </div>
            )}
          </div>

          {/* Featured Image */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Featured Image</h2>

            {featuredImage ? (
              <div className="space-y-3">
                <div className="aspect-video rounded overflow-hidden border border-[rgba(245,240,250,0.14)] relative group">
                  <NextImage src={featuredImage} alt="Featured preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[#FF2E88] font-bold text-xs"
                  >
                    <Trash size={16} className="mr-1" /> Remove Image
                  </button>
                </div>
                <p className="text-[10px] text-[#9C8FAE]/45 truncate bg-[#0B0710] p-1.5 rounded border border-[rgba(245,240,250,0.08)] font-mono">
                  {featuredImage}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMediaModalOpen(true)
                  fetchMedia()
                }}
                className="w-full aspect-video border border-dashed border-[rgba(245,240,250,0.14)] rounded flex flex-col items-center justify-center text-[#9C8FAE]/50 hover:border-[#9C8FAE]/20 hover:text-white transition group bg-[#0B0710]/40"
              >
                <ImageIcon size={24} className="mb-2 text-[#9C8FAE]/30 group-hover:text-[#FF2E88] transition" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Select Featured Image</span>
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Category Assignment</h2>
            <div>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF] cursor-pointer"
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Input (type + enter) */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 flex items-center uppercase tracking-wider">
              <Tag size={16} className="mr-1.5 text-[#00E5FF]" /> Tag Cloud
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Type tag and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
              />

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-[#FF2E88]/10 text-[#FF2E88] text-[10px] font-bold font-mono border border-[#FF2E88]/15"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="ml-1.5 hover:text-white"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[rgba(245,240,250,0.14)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-anton uppercase tracking-wider">Choose Featured Image</h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="text-[#9C8FAE] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#0B0710]/50">
              {isLoadingMedia ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-[#00E5FF] h-8 w-8" />
                </div>
              ) : mediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectFeaturedImage(item.url)}
                      className="group border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF] bg-[#150C1F] rounded overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-[rgba(245,240,250,0.14)] overflow-hidden">
                        <NextImage
                          src={item.url}
                          alt={item.alt_text || "Featured Image Preview"}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-contain group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-white font-semibold truncate" title={item.filename}>
                          {item.filename}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-[rgba(245,240,250,0.14)] rounded">
                  <p className="text-xs text-[#9C8FAE]">No media found. Upload media in the Media Library first!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
