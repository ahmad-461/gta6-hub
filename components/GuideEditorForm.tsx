"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
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
  Search,
  CheckCircle,
  Eye,
  Loader2,
  Trash,
  ChevronRight,
  List,
  X
} from "lucide-react"

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
})

interface GuideEditorFormProps {
  guideId?: string
}

export default function GuideEditorForm({ guideId }: GuideEditorFormProps) {
  const router = useRouter()
  const isEditing = !!guideId

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

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

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const formData = {
      title,
      slug,
      content,
      guideCategory,
      difficulty,
      status,
      publishedAt: publishedAt || undefined,
      featuredImage: featuredImage || undefined,
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
        status,
        featured_image: featuredImage || null,
        word_count: wordCount,
        toc: toc, // save table of contents JSONB dynamically!
        published_at: publishedAt ? new Date(publishedAt).toISOString() : (status === "published" ? new Date().toISOString() : null),
        author_id: authorId,
        updated_at: new Date().toISOString(),
      }

      if (isEditing) {
        const { error } = await supabase
          .from("guides")
          .update(savePayload)
          .eq("id", guideId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("guides")
          .insert({
            ...savePayload,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
      }

      toast.success(isEditing ? "Guide updated successfully!" : "Guide published/created successfully!")
      router.push("/admin/guides")
    } catch (err: any) {
      toast.error(err.message || "Failed to save guide.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push("/admin/guides")}
            className="p-2 bg-card-bg border border-card-border rounded-lg hover:bg-card-border/60 transition text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              {isEditing ? "Edit Strategy Guide" : "New Strategy Guide"}
            </h1>
            <p className="text-xs text-foreground/45 mt-0.5">
              {isEditing ? `Guide ID: ${guideId}` : "Drafting a new game walkthrough"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-neon-blue hover:bg-neon-blue/90 text-black font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {isEditing ? "Update Guide" : "Save & Publish"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main content column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/85 mb-1.5">Guide Title</label>
              <input
                type="text"
                required
                placeholder="Enter guide walkthrough title..."
                value={title}
                onChange={handleTitleChange}
                className="block w-full px-3.5 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground/85 mb-1.5">Slug URL</label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-card-border bg-[#0b0a0e] text-foreground/45 text-xs font-mono">
                  /guides/
                </span>
                <input
                  type="text"
                  required
                  placeholder="walkthrough-slug-url"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="block w-full px-3.5 py-2 bg-[#100e16] border border-card-border rounded-r-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-3">
            <label className="block text-sm font-semibold text-white">Walkthrough Content</label>
            <TiptapEditor content={content} onChange={setContent} />
            {/* Editor Footer: Word count & read estimator */}
            <div className="flex items-center justify-between text-xs text-foreground/45 pt-2 border-t border-card-border/40 px-1 font-mono">
              <span className="flex items-center">
                <FileText size={14} className="mr-1" /> {wordCount} Words
              </span>
              <span className="flex items-center">
                <Clock size={14} className="mr-1" /> Estimated {readTime} min read
              </span>
            </div>
          </div>

          {/* Live Table of Contents Preview */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 border-b border-card-border pb-3 mb-2">
              <List size={18} className="text-neon-blue" />
              <h2 className="text-base font-bold text-white">Table of Contents Preview</h2>
            </div>
            {toc.length > 0 ? (
              <ul className="space-y-2 text-sm text-foreground/75 list-inside">
                {toc.map((heading, index) => (
                  <li key={index} className="flex items-center space-x-2 bg-[#100e16] py-2 px-3 rounded border border-card-border/40">
                    <ChevronRight size={14} className="text-neon-pink" />
                    <span className="font-semibold text-white">{heading.text}</span>
                    <span className="text-[10px] text-foreground/40 font-mono bg-card-border px-1.5 py-0.5 rounded ml-auto">
                      #{heading.id}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground/40 italic">
                Add standard H2 headings inside the content editor to auto-populate the table of contents.
              </p>
            )}
          </div>
        </div>

        {/* Right sidebar metadata column */}
        <div className="space-y-6">
          {/* Status, Publishing Time */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Publishing Status</h2>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Visibility Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue cursor-pointer font-semibold"
              >
                <option value="draft">Draft</option>
                <option value="published">Published / Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {status === "published" && (
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                  <Calendar size={14} className="mr-1 text-neon-blue" />
                  Publish Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue"
                />
              </div>
            )}
          </div>

          {/* Difficulty Level */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Walkthrough Difficulty</h2>
            <div>
              <select
                required
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Guide Category */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Guide Category</h2>
            <div>
              <select
                required
                value={guideCategory}
                onChange={(e) => setGuideCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue cursor-pointer"
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
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Featured Image</h2>

            {featuredImage ? (
              <div className="space-y-3">
                <div className="aspect-video rounded-lg overflow-hidden border border-card-border relative group">
                  <img src={featuredImage} alt="Featured preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-neon-pink font-bold text-xs"
                  >
                    <Trash size={16} className="mr-1" /> Remove Image
                  </button>
                </div>
                <p className="text-xs text-foreground/45 truncate bg-[#100e16] p-1.5 rounded border border-card-border/40 font-mono">
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
                className="w-full aspect-video border-2 border-dashed border-card-border rounded-lg flex flex-col items-center justify-center text-foreground/50 hover:border-foreground/20 hover:text-white transition group bg-[#100e16]/40"
              >
                <ImageIcon size={24} className="mb-2 text-foreground/30 group-hover:text-neon-pink transition" />
                <span className="text-xs font-semibold">Select Featured Image</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Featured Image Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Choose Featured Image</h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="text-foreground/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#110f17]/50">
              {isLoadingMedia ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
                </div>
              ) : mediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectFeaturedImage(item.url)}
                      className="group border border-card-border hover:border-neon-blue bg-card-bg rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-card-border">
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
                <div className="text-center py-12 border border-dashed border-card-border rounded-lg">
                  <p className="text-sm text-foreground/40">No media found. Upload media in the Media Library first!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
