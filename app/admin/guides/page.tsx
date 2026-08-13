"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import { toast } from "sonner"
import Papa from "papaparse"
import { logAdminActivity } from "@/lib/activity"
import {
  Plus,
  Search,
  Copy,
  Edit2,
  BookOpen,
  CheckSquare,
  Square,
  Download,
  ArrowUpDown
} from "lucide-react"

export default function GuideManagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [guides, setGuides] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Search from URL query params or fallback
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [selectedGuideCategory, setSelectedGuideCategory] = useState(searchParams.get("category") || "")
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get("difficulty") || "")
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "")
  const [selectedAuthor, setSelectedAuthor] = useState(searchParams.get("author") || "")
  const [sortField, setSortField] = useState(searchParams.get("sortField") || "created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc")

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("query", searchQuery)
    if (selectedGuideCategory) params.set("category", selectedGuideCategory)
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty)
    if (selectedStatus) params.set("status", selectedStatus)
    if (selectedAuthor) params.set("author", selectedAuthor)
    if (sortField) params.set("sortField", sortField)
    if (sortOrder) params.set("sortOrder", sortOrder)

    router.replace(`/admin/guides?${params.toString()}`)
  }, [searchQuery, selectedGuideCategory, selectedDifficulty, selectedStatus, selectedAuthor, sortField, sortOrder, router])

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

      for (const id of selectedIds) {
        const item = guides.find((g) => g.id === id)
        await logAdminActivity({
          action: "published",
          entityType: "guide",
          entityId: id,
          entityTitle: item?.title || "Guide Bulk Published"
        })
      }

      toast.success(`Successfully published ${selectedIds.length} guides!`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to publish selected guides.")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected guides?`)) return
    try {
      for (const id of selectedIds) {
        const item = guides.find((g) => g.id === id)
        await logAdminActivity({
          action: "deleted",
          entityType: "guide",
          entityId: id,
          entityTitle: item?.title || "Guide Bulk Deleted"
        })
      }

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

      for (const id of selectedIds) {
        const item = guides.find((g) => g.id === id)
        await logAdminActivity({
          action: "updated",
          entityType: "guide",
          entityId: id,
          entityTitle: `${item?.title || "Guide"} moved guide category`
        })
      }

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

      const { data, error } = await supabase
        .from("guides")
        .insert(duplicatedGuide)
        .select()
        .single()

      if (error) throw error

      await logAdminActivity({
        action: "created",
        entityType: "guide",
        entityId: data.id,
        entityTitle: duplicatedGuide.title
      })

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  // Filter & Sort Logic
  const filteredGuides = guides
    .filter((guide) => {
      const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedGuideCategory ? guide.guide_category === selectedGuideCategory : true
      const matchesDifficulty = selectedDifficulty ? guide.difficulty === selectedDifficulty : true

      let guideStatus = guide.status
      if (guide.status === "published" && guide.published_at && new Date(guide.published_at) > new Date()) {
        guideStatus = "scheduled"
      }
      const matchesStatus = selectedStatus ? guideStatus === selectedStatus : true

      const matchesAuthor = selectedAuthor ? guide.author_id === selectedAuthor : true

      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus && matchesAuthor
    })
    .sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
      } else {
        return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1)
      }
    })

  // Export Filtered list to CSV using PapaParse
  const handleExportCSV = () => {
    if (filteredGuides.length === 0) {
      toast.error("No guides available in the current filtered state to export.")
      return
    }

    const csvData = filteredGuides.map((guide) => ({
      ID: guide.id,
      Title: guide.title,
      Slug: guide.slug,
      Guide_Category: guide.guide_category,
      Difficulty: guide.difficulty,
      Status: guide.status,
      Author: authors.find((a) => a.id === guide.author_id)?.name || "System",
      Created_At: guide.created_at,
      Updated_At: guide.updated_at,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `guides_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Successfully exported ${filteredGuides.length} guides to CSV!`)
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            Guides & Walkthroughs
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Publish missions walkthroughs, dynamic cheat books, or collectibles guides.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/40 text-white font-bold text-xs uppercase tracking-wider rounded transition"
          >
            <Download size={14} className="mr-2 text-[#00E5FF]" />
            Export Filtered CSV
          </button>

          <Link
            href="/admin/guides/new"
            prefetch={false}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150"
          >
            <Plus size={18} className="mr-2" />
            New Guide
          </Link>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search guides by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
            />
          </div>

          {/* Guide Category Filter */}
          <select
            value={selectedGuideCategory}
            onChange={(e) => setSelectedGuideCategory(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs cursor-pointer font-bold"
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
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs cursor-pointer font-bold"
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
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs cursor-pointer font-bold"
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
        <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/25 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#00E5FF] font-bold uppercase tracking-wider">
            {selectedIds.length} guides selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkPublish}
              className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black text-[10px] font-bold rounded uppercase tracking-wider transition"
            >
              Publish Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white text-[10px] font-bold rounded uppercase tracking-wider transition"
            >
              Delete Selected
            </button>
            <select
              onChange={(e) => {
                handleBulkChangeCategory(e.target.value)
                e.target.value = ""
              }}
              className="px-3 py-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-[10px] text-white focus:outline-none cursor-pointer"
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
        <LoadingSkeleton type="table" rows={6} cols={5} />
      ) : filteredGuides.length > 0 ? (
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/50 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-4 px-6 w-10">
                    <button onClick={handleSelectAll} className="text-[#9C8FAE]/60 hover:text-white transition">
                      {selectedIds.length === filteredGuides.length ? (
                        <CheckSquare size={18} className="text-[#FF2E88]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("title")}>
                    <span className="flex items-center space-x-1">
                      <span>Title</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Guide Category</th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("difficulty")}>
                    <span className="flex items-center space-x-1">
                      <span>Difficulty</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("status")}>
                    <span className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Author</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,240,250,0.08)] text-xs">
                {filteredGuides.map((guide, idx) => {
                  const isSelected = selectedIds.includes(guide.id)
                  const authorName = authors.find((a) => a.id === guide.author_id)?.name || "System"

                  let diffClass = "text-[#00E5FF]"
                  if (guide.difficulty === "Intermediate") diffClass = "text-amber-500"
                  if (guide.difficulty === "Advanced") diffClass = "text-[#FF2E88]"

                  // Determine status badge
                  let statusLabel = "Draft"
                  let statusClass = "bg-[#9C8FAE]/10 text-[#9C8FAE]"

                  if (guide.status === "published") {
                    if (guide.published_at && new Date(guide.published_at) > new Date()) {
                      statusLabel = "Scheduled"
                      statusClass = "bg-amber-500/10 text-amber-500"
                    } else {
                      statusLabel = "Published"
                      statusClass = "bg-emerald-500/10 text-emerald-500"
                    }
                  } else if (guide.status === "archived") {
                    statusLabel = "Archived"
                    statusClass = "bg-[#9C8FAE]/5 text-[#9C8FAE]/40"
                  }

                  return (
                    <tr
                      key={guide.id}
                      className={`transition duration-150 ${
                        idx % 2 === 0 ? "bg-[#150C1F]" : "bg-[#0B0710]"
                      } ${isSelected ? "bg-[#00E5FF]/5" : ""}`}
                    >
                      <td className="py-4 px-6">
                        <button onClick={() => handleSelectId(guide.id)} className="text-[#9C8FAE]/60 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-[#FF2E88]" />
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
                          <p className="text-[10px] text-[#9C8FAE]/40 font-mono truncate mt-0.5">
                            /guides/{guide.slug}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[10px] text-white">
                          {guide.guide_category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-semibold text-xs ${diffClass}`}>
                          {guide.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE]">{authorName}</td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <Link
                          href={`/admin/guides/${guide.id}`}
                          prefetch={false}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/50 text-[#9C8FAE] hover:text-[#00E5FF] rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(guide)}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#FF2E88]/50 text-[#9C8FAE] hover:text-[#FF2E88] rounded transition"
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
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No Guides Found"
          description="Create your first published or draft strategy guide to help players navigate Leonida."
        />
      )}
    </div>
  )
}
