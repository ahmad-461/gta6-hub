"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import NextImage from "next/image"
import { z } from "zod"
import { toast } from "sonner"
import {
  Video,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  X,
  Image as ImageIcon,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react"

// Zod validation schemas
const breakdownSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" }),
  trailer_source_url: z.string().url({ message: "Must be a valid trailer video URL" }),
  intro: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
})

export default function TrailerManagerPage() {
  const [breakdowns, setBreakdowns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Form Drawer/Modal States
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  // Trailer Fields
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [trailerSourceUrl, setTrailerSourceUrl] = useState("")
  const [intro, setIntro] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")

  // Trailer Moments Form list state
  const [moments, setMoments] = useState<any[]>([])

  // Media picker popup
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [activeMomentIndexForImage, setActiveMomentIndexForImage] = useState<number | null>(null)

  useEffect(() => {
    fetchBreakdowns()
  }, [])

  const fetchBreakdowns = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("trailer_breakdowns")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setBreakdowns(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load breakdowns.")
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleOpenNew = () => {
    setIsEditing(false)
    setCurrentId(null)
    setTitle("")
    setSlug("")
    setTrailerSourceUrl("")
    setIntro("")
    setStatus("draft")
    setMoments([])
    setIsOpen(true)
  }

  const handleOpenEdit = async (tb: any) => {
    setIsEditing(true)
    setCurrentId(tb.id)
    setTitle(tb.title || "")
    setSlug(tb.slug || "")
    setTrailerSourceUrl(tb.trailer_source_url || "")
    setIntro(tb.intro || "")
    setStatus(tb.status || "draft")

    // Fetch matching moments
    try {
      const { data: momentsData } = await supabase
        .from("trailer_breakdown_moments")
        .select("*")
        .eq("breakdown_id", tb.id)
        .order("order", { ascending: true })

      setMoments(momentsData || [])
    } catch (err) {
      console.error("Failed to load breakdown moments", err)
    }

    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trailer breakdown? This deletes all matching moments.")) {
      return
    }
    try {
      const { error } = await supabase.from("trailer_breakdowns").delete().eq("id", id)
      if (error) throw error
      toast.success("Trailer breakdown deleted successfully.")
      setBreakdowns((prev) => prev.filter((tb) => tb.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete breakdown.")
    }
  }

  // Moments helper actions
  const handleAddMoment = () => {
    setMoments([
      ...moments,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        timestamp_label: "0:00",
        screenshot_image: "",
        annotation_text: "",
        order: moments.length,
      },
    ])
  }

  const handleRemoveMoment = (index: number) => {
    setMoments(moments.filter((_, idx) => idx !== index))
  }

  const handleUpdateMomentField = (index: number, field: string, value: any) => {
    const updated = [...moments]
    updated[index] = { ...updated[index], [field]: value }
    setMoments(updated)
  }

  const handleMoveMoment = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === moments.length - 1) return

    const updated = [...moments]
    const targetIdx = direction === "up" ? index - 1 : index + 1
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp

    // Reset explicit order index sequence
    const ordered = updated.map((m, idx) => ({ ...m, order: idx }))
    setMoments(ordered)
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

  const handleSelectImageForMoment = (url: string) => {
    if (activeMomentIndexForImage !== null) {
      handleUpdateMomentField(activeMomentIndexForImage, "screenshot_image", url)
    }
    setIsMediaModalOpen(false)
    setActiveMomentIndexForImage(null)
    toast.success("Moment screenshot applied!")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = { title, slug, trailer_source_url: trailerSourceUrl, intro, status }
    const validation = breakdownSchema.safeParse(formData)

    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        toast.error(`${err.path.join(".")}: ${err.message}`)
      })
      return
    }

    try {
      const payload = {
        title,
        slug,
        trailer_source_url: trailerSourceUrl,
        intro,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      }

      let breakdownId = currentId

      if (isEditing && currentId) {
        const { error } = await supabase
          .from("trailer_breakdowns")
          .update(payload)
          .eq("id", currentId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("trailer_breakdowns")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (error) throw error
        breakdownId = data.id
      }

      // Sync breakdown moments
      if (breakdownId) {
        // Clear all existing moments for this breakdown
        await supabase.from("trailer_breakdown_moments").delete().eq("breakdown_id", breakdownId)

        // Bulk insert updated moments
        if (moments.length > 0) {
          const payloadMoments = moments.map((m, idx) => ({
            breakdown_id: breakdownId,
            timestamp_label: m.timestamp_label || "0:00",
            screenshot_image: m.screenshot_image || null,
            annotation_text: m.annotation_text || "",
            order: idx,
            created_at: new Date().toISOString(),
          }))

          const { error: momentsErr } = await supabase
            .from("trailer_breakdown_moments")
            .insert(payloadMoments)

          if (momentsErr) throw momentsErr
        }
      }

      toast.success("Trailer breakdown saved successfully!")
      setIsOpen(false)
      fetchBreakdowns()
    } catch (err: any) {
      toast.error(err.message || "Failed to save breakdown.")
    }
  }

  const filteredBreakdowns = breakdowns.filter((tb) =>
    (tb.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Curated Trailer Breakdowns
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Create high-fidelity analytical breakdowns. Embed YouTube clips and map vertical scroll annotations matching exact timestamps.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
        >
          <Plus size={18} className="mr-2" />
          New Breakdown
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-card-bg border border-card-border p-5 rounded-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search breakdowns by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredBreakdowns.length > 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f17] border-b border-card-border text-foreground/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Breakdown Title</th>
                  <th className="py-4 px-6">Trailer Source</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50 text-sm">
                {filteredBreakdowns.map((tb) => (
                  <tr key={tb.id} className="hover:bg-[#110f17]/40 transition duration-150">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white">{tb.title}</p>
                      <p className="text-xs text-foreground/50 mt-0.5 font-mono">/{tb.slug}</p>
                    </td>
                    <td className="py-4 px-6 text-foreground/80 max-w-xs truncate">{tb.trailer_source_url}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tb.status === "published" ? "bg-neon-blue/15 text-neon-blue" : "bg-foreground/10 text-foreground/60"
                      }`}>
                        {tb.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-foreground/60">
                      {new Date(tb.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(tb)}
                        className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-blue/50 text-foreground/75 hover:text-white rounded transition"
                        title="Edit breakdown"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tb.id)}
                        className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-pink/50 text-foreground/75 hover:text-neon-pink rounded transition"
                        title="Delete breakdown"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl bg-card-bg/50">
          <Video size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No trailer breakdowns found. Build one now!</p>
        </div>
      )}

      {/* Breakdown Drawer / Modal Editor */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0c12] border border-card-border rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                {isEditing ? "Edit Trailer Breakdown" : "New Trailer Breakdown"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-foreground/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GTA VI Trailer 1 Comprehensive breakdown"
                    value={title}
                    onChange={handleTitleChange}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Slug URL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. trailer-1-analysis"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">YouTube Trailer URL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://www.youtube.com/watch?v=QdBZY2fkU-0"
                    value={trailerSourceUrl}
                    onChange={(e) => setTrailerSourceUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Intro/Teaser text</label>
                <textarea
                  placeholder="Draft an introductory summary describing overall breakdown expectations and key highlights..."
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue min-h-[60px]"
                />
              </div>

              {/* Curated Moments Checklist Editor */}
              <div className="space-y-4 border-t border-card-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase text-foreground/50 tracking-wider">
                    Breakdown Moments Timeline Checklist ({moments.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMoment}
                    className="px-3 py-1 bg-neon-blue hover:bg-neon-blue/80 text-black text-xs font-bold rounded uppercase tracking-wider flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Add Moment</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {moments.map((moment, idx) => (
                    <div key={moment.id || idx} className="bg-[#14121a] p-4 rounded-lg border border-card-border space-y-3 relative group">
                      {/* Top sorting and helper bar */}
                      <div className="flex justify-between items-center text-xs text-foreground/45 border-b border-card-border/40 pb-2">
                        <span className="font-bold uppercase tracking-wider text-neon-pink">
                          Moment #{idx + 1}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleMoveMoment(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMoment(idx, "down")}
                            disabled={idx === moments.length - 1}
                            className="p-1 hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <span className="text-foreground/20">|</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMoment(idx)}
                            className="text-xs text-red-400 hover:text-red-300 font-bold uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Moment Core Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div className="md:col-span-1 space-y-3">
                          {/* Timestamp label */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-foreground/60 mb-1">Timestamp</label>
                            <div className="flex items-center space-x-1.5">
                              <Clock size={12} className="text-neon-blue" />
                              <input
                                type="text"
                                placeholder="e.g. 0:42"
                                required
                                value={moment.timestamp_label}
                                onChange={(e) => handleUpdateMomentField(idx, "timestamp_label", e.target.value)}
                                className="w-full px-2 py-1 bg-[#100e16] border border-card-border rounded text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Snapshot field */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-foreground/60 mb-1">Screenshot</label>
                            {moment.screenshot_image ? (
                              <div className="space-y-1.5">
                                <div className="aspect-video relative rounded border border-card-border overflow-hidden">
                                  <NextImage src={moment.screenshot_image} alt="Moment snapshot" fill className="object-cover" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMomentField(idx, "screenshot_image", "")}
                                  className="text-[9px] text-neon-pink font-bold uppercase hover:underline"
                                >
                                  Remove Screenshot
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMomentIndexForImage(idx)
                                  setIsMediaModalOpen(true)
                                  fetchMedia()
                                }}
                                className="w-full aspect-video border border-dashed border-card-border/80 rounded bg-[#100e16] flex flex-col items-center justify-center text-[10px] text-foreground/45 hover:text-white transition"
                              >
                                <ImageIcon size={14} className="mb-1 text-foreground/30" />
                                <span>Choose Screenshot</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Annotation text */}
                        <div className="md:col-span-3">
                          <label className="block text-[10px] uppercase font-bold text-foreground/60 mb-1">Analysis & Annotation</label>
                          <textarea
                            placeholder="Draft key findings, vehicle types, character callbacks, frame annotations, or Easter eggs visible in this shot..."
                            required
                            value={moment.annotation_text}
                            onChange={(e) => handleUpdateMomentField(idx, "annotation_text", e.target.value)}
                            className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-xs text-white focus:outline-none min-h-[92px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {moments.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-card-border/60 rounded-lg">
                    <p className="text-xs text-foreground/45">No moments annotated yet. Press &apos;Add Moment&apos; above to build your vertical timeline.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-[#1a1822] hover:bg-card-border/50 text-white text-xs font-semibold rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neon-pink hover:bg-neon-pink/90 text-white text-xs font-bold rounded transition uppercase tracking-wider"
                >
                  Save Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-55 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Screenshot Image</h3>
              <button
                type="button"
                onClick={() => {
                  setIsMediaModalOpen(false)
                  setActiveMomentIndexForImage(null)
                }}
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
                      onClick={() => handleSelectImageForMoment(item.url)}
                      className="group border border-card-border hover:border-neon-blue bg-card-bg rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-card-border overflow-hidden">
                        <NextImage
                          src={item.url}
                          alt={item.alt_text || "Screenshot asset"}
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
                <div className="text-center py-12 border border-dashed border-card-border rounded-lg">
                  <p className="text-sm text-foreground/40">No media found. Upload media in the Media Library first!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
