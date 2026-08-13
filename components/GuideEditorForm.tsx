"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { logAdminActivity } from "@/lib/activity"
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
  ChevronRight,
  List,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { generateAIDraftAction } from "@/app/actions/draft"
import { checkDuplicateSimilarityAction } from "@/app/actions/duplicate"
import { triggerEmbeddingsGeneration } from "@/app/actions/publish"

// Zod Schema for Guide Form
const guideSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  guideCategory: z.enum(["Getting Started", "Story", "Online", "Cheats", "Secrets"]),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().optional(),
  featuredImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

interface GuideEditorFormProps {
  guideId?: string
}

export default function GuideEditorForm({ guideId }: GuideEditorFormProps) {
  const router = useRouter()
  const isEditing = !!guideId

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

  // AI Draft & Duplicate Warnings State
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false)
  const [aiNotes, setAiNotes] = useState("")
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{ title: string; slug: string; contentType: string } | null>(null)

  // Form Fields State
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [content, setContent] = useState("")
  const [guideCategory, setGuideCategory] = useState<"Getting Started" | "Story" | "Online" | "Cheats" | "Secrets">("Getting Started")
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [publishedAt, setPublishedAt] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")

  // Live Table of Contents Preview State
  const [toc, setToc] = useState<any[]>([])

  // SEO & FAQ State
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([])
  const [faqQuestion, setFaqQuestion] = useState("")
  const [faqAnswer, setFaqAnswer] = useState("")

  // Media Picker inside the Editor
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchGuideData()
    }
  }, [guideId])

  // Generate Table of Contents from H2 headings in content
  useEffect(() => {
    const generateToC = (htmlContent: string) => {
      const regex = /<h2[^>]*>(.*?)<\/h2>/gi
      const headings = []
      let match
      while ((match = regex.exec(htmlContent)) !== null) {
        const text = match[1].replace(/<[^>]*>/g, "").trim()
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
        headings.push({
          id: id || `heading-${headings.length + 1}`,
          text: text,
          level: 2,
        })
      }
      return headings
    }

    setToc(generateToC(content))
  }, [content])

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

  const fetchGuideData = async () => {
    try {
      const { data: guide, error } = await supabase
        .from("guides")
        .select("*")
        .eq("id", guideId)
        .single()

      if (error) {
        toast.error("Failed to load guide details.")
        router.push("/admin/guides")
        return
      }

      setTitle(guide.title)
      setSlug(guide.slug)
      setContent(guide.content)
      setGuideCategory(guide.guide_category || "Getting Started")
      setDifficulty(guide.difficulty || "Beginner")
      setStatus(guide.status || "draft")
      setFeaturedImage(guide.featured_image || "")
      setSeoTitle(guide.seo_title || "")
      setSeoDescription(guide.seo_description || "")
      setFaq(Array.isArray(guide.faq) ? guide.faq : [])

      if (guide.published_at) {
        const dateObj = new Date(guide.published_at)
        const offset = dateObj.getTimezoneOffset()
        const localDate = new Date(dateObj.getTime() - offset * 60 * 1000)
        setPublishedAt(localDate.toISOString().slice(0, 16))
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

  // Word count & read time
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
      const dupCheck = await checkDuplicateSimilarityAction({ content, ignoreId: guideId })
      if (dupCheck.isDuplicate) {
        setDuplicateWarning({
          title: dupCheck.title || "",
          slug: dupCheck.slug || "",
          contentType: dupCheck.contentType || ""
        })
        toast.warning("Similarity Warning: High resemblance to an existing page. Review before proceeding.")
        setIsSaving(false)
        return
      }
    }

    const formData = {
      title,
      slug,
      content,
      guideCategory,
      difficulty,
      status: targetStatus,
      publishedAt: publishedAt || undefined,
      featuredImage: featuredImage || undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    }

    const validation = guideSchema.safeParse(formData)
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
        guide_category: guideCategory,
        difficulty,
        status: targetStatus,
        featured_image: featuredImage || null,
        word_count: wordCount,
        toc: toc, // save table of contents JSONB dynamically!
        published_at: publishedAt ? new Date(publishedAt).toISOString() : (targetStatus === "published" ? new Date().toISOString() : null),
        author_id: authorId,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        faq: faq || [],
        updated_at: new Date().toISOString(),
      }

      let savedGuideId = guideId

      if (isEditing) {
        const { error } = await supabase
          .from("guides")
          .update(savePayload)
          .eq("id", guideId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("guides")
          .insert({
            ...savePayload,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (error) throw error
        savedGuideId = data?.id
      }

      // Log audit trail action
      if (savedGuideId) {
        await logAdminActivity({
          action: isEditing ? "updated" : "created",
          entityType: "guide",
          entityId: savedGuideId,
          entityTitle: title
        })
      }

      toast.success(isEditing ? "Guide updated successfully!" : "Guide published/created successfully!")

      // Trigger embeddings generation via server action
      if (savedGuideId) {
        try {
          await triggerEmbeddingsGeneration(savedGuideId, "guide")
        } catch (embErr) {
          console.error("Embeddings trigger error:", embErr)
        }
      }

      router.push("/admin/guides")
    } catch (err: any) {
      toast.error(err.message || "Failed to save guide.")
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
            onClick={() => router.push("/admin/guides")}
            className="p-2 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded hover:bg-[#0B0710] transition text-[#9C8FAE] hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-normal text-white sm:text-3xl font-anton uppercase tracking-wider">
              {isEditing ? "Edit Strategy Guide" : "New Strategy Guide"}
            </h1>
            <p className="text-xs text-[#9C8FAE] mt-0.5">
              {isEditing ? `Guide ID: ${guideId}` : "Drafting a new game walkthrough"}
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
          {isEditing ? "Update Guide" : "Save & Publish"}
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
                Open and compare original walkthrough &rarr;
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
                  Paste your raw walkthrough notes, leaked codes, or map coordinates. The assistant will format a high-quality rich-text strategy guide draft.
                </p>
                <textarea
                  placeholder="Paste your raw notes, leak transcripts, or strategy guide details here..."
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
                      contentType: "guide",
                      categoryName: guideCategory
                    })
                    setIsGeneratingDraft(false)
                    if (res.success && res.html) {
                      setContent(res.html)
                      toast.success("Strategy guide draft generated and loaded into Tiptap!")
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
              <label className="block text-xs font-semibold text-[#9C8FAE] uppercase tracking-wider mb-1.5">Guide Title</label>
              <input
                type="text"
                required
                placeholder="Enter guide walkthrough title..."
                value={title}
                onChange={handleTitleChange}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] uppercase tracking-wider mb-1.5">Slug URL</label>
              <div className="flex rounded shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-[rgba(245,240,250,0.14)] bg-[#0B0710] text-[#9C8FAE]/45 text-xs font-mono">
                  /guides/
                </span>
                <input
                  type="text"
                  required
                  placeholder="walkthrough-slug-url"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="block w-full px-3.5 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded-r text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-3">
            <label className="block text-xs font-semibold text-white uppercase tracking-wider">Walkthrough Content</label>
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

          {/* Live Table of Contents Preview */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-3">
            <div className="flex items-center space-x-2 border-b border-[rgba(245,240,250,0.14)] pb-3 mb-2">
              <List size={18} className="text-[#00E5FF]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Table of Contents Preview</h2>
            </div>
            {toc.length > 0 ? (
              <ul className="space-y-2 text-xs text-[#9C8FAE] list-inside">
                {toc.map((heading, index) => (
                  <li key={index} className="flex items-center space-x-2 bg-[#0B0710] py-2 px-3 rounded border border-[rgba(245,240,250,0.08)]">
                    <ChevronRight size={14} className="text-[#FF2E88]" />
                    <span className="font-semibold text-white">{heading.text}</span>
                    <span className="text-[10px] text-[#9C8FAE]/40 font-mono bg-[rgba(245,240,250,0.14)] px-1.5 py-0.5 rounded ml-auto">
                      #{heading.id}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#9C8FAE] italic">
                Add standard H2 headings inside the content editor to auto-populate the table of contents.
              </p>
            )}
          </div>

          {/* SEO Metadata Options */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <div className="border-b border-[rgba(245,240,250,0.14)] pb-3 flex items-center space-x-2">
              <FileText className="text-[#FF2E88]" size={18} />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">SEO Meta Override</h2>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5">Custom Meta Title</label>
              <input
                type="text"
                placeholder="Override default title for SEO tag..."
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5">Custom Meta Description</label>
              <textarea
                rows={3}
                placeholder="Override default description for search engines..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs resize-none"
              />
            </div>
          </div>

          {/* FAQ Builder */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <div className="border-b border-[rgba(245,240,250,0.14)] pb-3 flex items-center space-x-2">
              <CheckCircle className="text-[#00E5FF]" size={18} />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Interactive FAQ Builder</h2>
            </div>

            {faq.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {faq.map((item, idx) => (
                  <div key={idx} className="bg-[#0B0710] p-3 rounded border border-[rgba(245,240,250,0.08)] flex justify-between items-start text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white">Q: {item.question}</p>
                      <p className="text-[#9C8FAE]">A: {item.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                      className="text-[#FF2E88] hover:text-[#FF2E88]/80 p-1 rounded hover:bg-[#FF2E88]/10 transition"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9C8FAE] italic">No FAQ items added yet. Added FAQs will generate beautiful JSON-LD Schema on this page!</p>
            )}

            <div className="border-t border-[rgba(245,240,250,0.14)] pt-3 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  placeholder="Enter Question..."
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Enter Answer..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs resize-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!faqQuestion.trim() || !faqAnswer.trim()) {
                    toast.error("Please enter both question and answer.")
                    return
                  }
                  setFaq([...faq, { question: faqQuestion.trim(), answer: faqAnswer.trim() }])
                  setFaqQuestion("")
                  setFaqAnswer("")
                  toast.success("FAQ item added!")
                }}
                className="w-full py-1.5 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-bold rounded uppercase tracking-wider transition"
              >
                Add FAQ Item
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar metadata column */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Publishing Status</h2>

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
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Difficulty</h2>
            <div>
              <select
                required
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF] cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Guide Category</h2>
            <div>
              <select
                required
                value={guideCategory}
                onChange={(e) => setGuideCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF] cursor-pointer"
              >
                <option value="Getting Started">Getting Started</option>
                <option value="Story">Story</option>
                <option value="Online">Online</option>
                <option value="Cheats">Cheats</option>
                <option value="Secrets">Secrets</option>
              </select>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Featured Image</h2>

            {featuredImage ? (
              <div className="space-y-3">
                <div className="aspect-video rounded overflow-hidden border border-[rgba(245,240,250,0.14)] relative group">
                  <img src={featuredImage} alt="Featured preview" className="w-full h-full object-cover" />
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
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-[rgba(245,240,250,0.14)]">
                        <img
                          src={item.url}
                          alt={item.alt_text}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
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
