"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  Eye,
  FolderOpen,
  Calendar,
  CheckSquare,
  Square,
  Sparkles
} from "lucide-react"

export default function GuideManagerPage() {
  const [guides, setGuides] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuideCategory, setSelectedGuideCategory] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedAuthor, setSelectedAuthor] = useState("")

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: guidesData, error: guidesErr } = await supabase
        .from("guides")
        .select(`
          id,
          title,
          slug,
          guide_category,
          difficulty,
          status,
          featured_image,
          word_count,
          published_at,
          created_at,
          updated_at,
          author_id
        `)
        .order("created_at", { ascending: false })

      if (guidesErr) throw guidesErr

      const { data: authorsData } = await supabase.from("profiles").select("id, name")

      setGuides(guidesData || [])
      setAuthors(authorsData || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load guides.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Bulk Actions
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return
    try {
      const { error } = await supabase
        .from("guides")
        .update({ status: "published", published_at: new Date().toISOString() })
        .in("id", selectedIds)

      if (error) throw error
      toast.success(`Successfully published ${selectedIds.length} guides!`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to publish selected guides.")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected guides?`)) return
    try {
      const { error } = await supabase
        .from("guides")
        .delete()
        .in("id", selectedIds)

      if (error) throw error
      toast.success(`Successfully deleted ${selectedIds.length} guides.`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected guides.")
    }
  }

  const handleBulkChangeCategory = async (cat: string) => {
    if (selectedIds.length === 0 || !cat) return
    try {
      const { error } = await supabase
        .from("guides")
        .update({ guide_category: cat })
        .in("id", selectedIds)

      if (error) throw error
      toast.success("Successfully updated category for selected guides.")
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to change category.")
    }
  }

  // One-click duplicate guide
  const handleDuplicate = async (guide: any) => {
    try {
      const uniqueSuffix = Date.now().toString().slice(-4)
      const duplicatedGuide = {
        title: `${guide.title} (Copy)`,
        slug: `${guide.slug}-copy-${uniqueSuffix}`,
        content: "Duplicated content...",
        guide_category: guide.guide_category,
        difficulty: guide.difficulty,
        status: "draft",
        featured_image: guide.featured_image,
        word_count: guide.word_count,
        author_id: guide.author_id,
        toc: [] as any,
      }

      const { data: fullOriginal } = await supabase
        .from("guides")
        .select("content, toc")
        .eq("id", guide.id)
        .single()

      if (fullOriginal) {
        duplicatedGuide.content = fullOriginal.content
        duplicatedGuide.toc = fullOriginal.toc
      }

      const { error } = await supabase
        .from("guides")
        .insert(duplicatedGuide)

      if (error) throw error
      toast.success("Guide duplicated successfully as draft!")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate guide.")
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredGuides.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredGuides.map((g) => g.id))
    }
  }

  const handleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Filtering
  const filteredGuides = guides.filter((guide) => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedGuideCategory ? guide.guide_category === selectedGuideCategory : true
    const matchesDifficulty = selectedDifficulty ? guide.difficulty === selectedDifficulty : true

    // Status check
    let guideStatus = guide.status
    if (guide.status === "published" && guide.published_at && new Date(guide.published_at) > new Date()) {
      guideStatus = "scheduled"
    }
    const matchesStatus = selectedStatus ? guideStatus === selectedStatus : true

    const matchesAuthor = selectedAuthor ? guide.author_id === selectedAuthor : true

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus && matchesAuthor
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Guides & Walkthroughs
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Publish missions walkthroughs, dynamic cheat books, or collectibles guides.
          </p>
        </div>
        <Link
          href="/admin/guides/new"
          prefetch={false}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-blue hover:bg-neon-blue/90 text-black font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
        >
          <Plus size={18} className="mr-2" />
          New Guide
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search guides by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
            />
          </div>

          {/* Guide Category Filter */}
          <select
            value={selectedGuideCategory}
            onChange={(e) => setSelectedGuideCategory(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue text-sm cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Getting Started">Getting Started</option>
            <option value="Story">Story</option>
            <option value="Online">Online</option>
            <option value="Cheats">Cheats</option>
            <option value="Secrets">Secrets</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue text-sm cursor-pointer animate-none"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue text-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-neon-blue/10 border border-neon-blue/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-neon-blue font-semibold">
            {selectedIds.length} guides selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkPublish}
              className="px-3 py-1.5 bg-neon-blue hover:bg-neon-blue/90 text-black text-xs font-bold rounded uppercase transition"
            >
              Publish Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-neon-pink hover:bg-neon-pink/90 text-white text-xs font-bold rounded uppercase transition"
            >
              Delete Selected
            </button>
            <select
              onChange={(e) => {
                handleBulkChangeCategory(e.target.value)
                e.target.value = ""
              }}
              className="px-3 py-1.5 bg-[#100e16] border border-card-border rounded text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="">Move to Category...</option>
              <option value="Getting Started">Getting Started</option>
              <option value="Story">Story</option>
              <option value="Online">Online</option>
              <option value="Cheats">Cheats</option>
              <option value="Secrets">Secrets</option>
            </select>
          </div>
        </div>
      )}

      {/* Guides Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredGuides.length > 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f17] border-b border-card-border text-foreground/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-10">
                    <button onClick={handleSelectAll} className="text-foreground/60 hover:text-white transition">
                      {selectedIds.length === filteredGuides.length ? (
                        <CheckSquare size={18} className="text-neon-blue" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Guide Category</th>
                  <th className="py-4 px-6">Difficulty</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Author</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50 text-sm">
                {filteredGuides.map((guide) => {
                  const isSelected = selectedIds.includes(guide.id)
                  const authorName = authors.find((a) => a.id === guide.author_id)?.name || "System"

                  let diffClass = "text-neon-blue"
                  if (guide.difficulty === "Intermediate") diffClass = "text-neon-yellow"
                  if (guide.difficulty === "Advanced") diffClass = "text-neon-pink"

                  // Determine status badge
                  let statusLabel = "Draft"
                  let statusClass = "bg-foreground/10 text-foreground/60"

                  if (guide.status === "published") {
                    if (guide.published_at && new Date(guide.published_at) > new Date()) {
                      statusLabel = "Scheduled"
                      statusClass = "bg-neon-yellow/15 text-neon-yellow"
                    } else {
                      statusLabel = "Published"
                      statusClass = "bg-neon-blue/15 text-neon-blue"
                    }
                  } else if (guide.status === "archived") {
                    statusLabel = "Archived"
                    statusClass = "bg-foreground/5 text-foreground/40"
                  }

                  return (
                    <tr
                      key={guide.id}
                      className={`hover:bg-[#110f17]/40 transition duration-150 ${
                        isSelected ? "bg-neon-blue/5" : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <button onClick={() => handleSelectId(guide.id)} className="text-foreground/60 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-neon-blue" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="max-w-xs md:max-w-sm">
                          <p className="truncate" title={guide.title}>
                            {guide.title}
                          </p>
                          <p className="text-xs text-foreground/40 font-mono truncate mt-0.5">
                            /guides/{guide.slug}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-foreground/80">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1c1a24] border border-card-border text-xs text-white">
                          {guide.guide_category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-semibold text-xs ${diffClass}`}>
                          {guide.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-foreground/80">{authorName}</td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <Link
                          href={`/admin/guides/${guide.id}`}
                          prefetch={false}
                          className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-blue/50 text-foreground/75 hover:text-neon-blue rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(guide)}
                          className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-purple/50 text-foreground/75 hover:text-neon-purple rounded transition"
                          title="One-click Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl bg-card-bg/50">
          <BookOpen size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No guides found matching search criteria.</p>
        </div>
      )}
    </div>
  )
}
