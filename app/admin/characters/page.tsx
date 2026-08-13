"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import NextImage from "next/image"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity"
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  ArrowUpDown
} from "lucide-react"

export default function CharacterManagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [characters, setCharacters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Search from URL query params or fallback
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "")
  const [sortField, setSortField] = useState(searchParams.get("sortField") || "created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc")

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchCharacters()
  }, [])

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("query", searchQuery)
    if (selectedStatus) params.set("status", selectedStatus)
    if (sortField) params.set("sortField", sortField)
    if (sortOrder) params.set("sortOrder", sortOrder)

    router.replace(`/admin/characters?${params.toString()}`)
  }, [searchQuery, selectedStatus, sortField, sortOrder, router])

  const fetchCharacters = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")

      if (error) throw error
      setCharacters(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load characters.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published"
    try {
      const { error } = await supabase
        .from("characters")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      const item = characters.find((c) => c.id === id)
      await logAdminActivity({
        action: newStatus === "published" ? "published" : "archived",
        entityType: "character",
        entityId: id,
        entityTitle: item?.name
      })

      toast.success(`Character status updated to ${newStatus}!`)
      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this character?")) return
    try {
      const item = characters.find((c) => c.id === id)
      await logAdminActivity({
        action: "deleted",
        entityType: "character",
        entityId: id,
        entityTitle: item?.name
      })

      const { error } = await supabase.from("characters").delete().eq("id", id)
      if (error) throw error
      toast.success("Character deleted successfully.")
      setCharacters((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete character.")
    }
  }

  // Bulk operations
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return
    try {
      const { error } = await supabase
        .from("characters")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .in("id", selectedIds)

      if (error) throw error

      for (const id of selectedIds) {
        const item = characters.find((c) => c.id === id)
        await logAdminActivity({
          action: "published",
          entityType: "character",
          entityId: id,
          entityTitle: item?.name || "Bulk Published"
        })
      }

      toast.success(`Successfully published ${selectedIds.length} characters!`)
      setCharacters((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: "published" } : c))
      )
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to publish characters.")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} characters?`)) return
    try {
      for (const id of selectedIds) {
        const item = characters.find((c) => c.id === id)
        await logAdminActivity({
          action: "deleted",
          entityType: "character",
          entityId: id,
          entityTitle: item?.name || "Bulk Deleted"
        })
      }

      const { error } = await supabase.from("characters").delete().in("id", selectedIds)
      if (error) throw error
      toast.success(`Deleted ${selectedIds.length} characters.`)
      setCharacters((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to delete characters.")
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCharacters.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCharacters.map((c) => c.id))
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
  const filteredCharacters = characters
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = selectedStatus ? c.status === selectedStatus : true
      return matchesSearch && matchesStatus
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

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            Character Cast
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Create, edit and manage biographies and background lore for GTA 6 story characters.
          </p>
        </div>
        <Link
          href="/admin/characters/new"
          prefetch={false}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150"
        >
          <Plus size={18} className="mr-2" />
          Add Character
        </Link>
      </div>

      {/* Filter Row */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search characters by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <button
            onClick={() => handleSort("name")}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs hover:border-[#FF2E88]/40 transition flex items-center space-x-1"
          >
            <span>Sort Name</span>
            <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FF2E88]/10 border border-[#FF2E88]/25 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#FF2E88] font-bold uppercase tracking-wider">
            {selectedIds.length} characters selected
          </p>
          <div className="flex items-center space-x-2">
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
          </div>
        </div>
      )}

      {/* Grid / List view of characters */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      ) : filteredCharacters.length > 0 ? (
        <div className="space-y-4">
          {/* Header Action checkbox */}
          <div className="flex items-center space-x-3 px-4 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-xs font-bold text-[#9C8FAE]/50 uppercase tracking-wider">
            <button onClick={handleSelectAll} className="text-[#9C8FAE]/60 hover:text-white transition">
              {selectedIds.length === filteredCharacters.length ? (
                <CheckSquare size={18} className="text-[#FF2E88]" />
              ) : (
                <Square size={18} />
              )}
            </button>
            <span>Select All Characters On Current View</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCharacters.map((character) => {
              const stats = character.stats_json || {}
              const isPublished = character.status === "published"
              const isSelected = selectedIds.includes(character.id)

              return (
                <div
                  key={character.id}
                  className={`bg-[#150C1F] border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-lg group ${
                    isSelected ? "border-[#FF2E88] bg-[#FF2E88]/5" : "border-[rgba(245,240,250,0.14)] hover:border-white/20"
                  }`}
                >
                  {/* Image Section */}
                  <div className="aspect-video bg-[#0b0a0e] relative overflow-hidden flex items-center justify-center border-b border-[rgba(245,240,250,0.14)]">
                    {/* Selector */}
                    <button
                      onClick={() => handleSelectId(character.id)}
                      className="absolute top-3 left-3 z-10 text-white bg-black/60 hover:bg-black/90 p-1.5 rounded transition"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-[#FF2E88]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    {character.featured_image ? (
                      <NextImage
                        src={character.featured_image}
                        alt={character.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Users size={40} className="text-foreground/20" />
                    )}
                    {/* Status Badge */}
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      isPublished ? "bg-[#00E5FF]/15 text-[#00E5FF]" : "bg-white/15 text-white/60"
                    }`}>
                      {character.status}
                    </span>
                  </div>

                  {/* Details Section */}
                  <div className="p-5 flex-grow space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-[#FF2E88] transition">
                        {character.name}
                      </h2>
                      <p className="text-xs text-[#9C8FAE]/40 font-mono mt-0.5">/characters/{character.slug}</p>
                    </div>

                    {/* Lore attributes preview */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#0B0710] p-3 rounded border border-[rgba(245,240,250,0.08)]">
                      <div>
                        <p className="text-[#9C8FAE]/40 uppercase font-bold tracking-wider text-[9px]">Role</p>
                        <p className="text-white font-semibold truncate mt-0.5">{stats.role || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[#9C8FAE]/40 uppercase font-bold tracking-wider text-[9px]">Voice Actor</p>
                        <p className="text-white font-semibold truncate mt-0.5">{stats.voice_actor || "N/A"}</p>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-[rgba(245,240,250,0.08)] mt-1">
                        <p className="text-[#9C8FAE]/40 uppercase font-bold tracking-wider text-[9px]">Affiliation</p>
                        <p className="text-white font-semibold truncate mt-0.5">{stats.affiliation || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-4 bg-[#0B0710]/95 border-t border-[rgba(245,240,250,0.14)] flex items-center justify-between">
                    <button
                      onClick={() => handleTogglePublish(character.id, character.status)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-[#9C8FAE]/60 hover:text-white transition"
                      title={isPublished ? "Unpublish character" : "Publish character"}
                    >
                      {isPublished ? (
                        <>
                          <ToggleRight className="text-[#00E5FF] h-5 w-5" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="text-white/30 h-5 w-5" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/characters/${character.id}`}
                        prefetch={false}
                        className="p-2 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/40 text-[#9C8FAE] hover:text-white rounded transition"
                        title="Edit details"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(character.id)}
                        className="p-2 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] hover:border-[#FF2E88]/40 text-[#9C8FAE] hover:text-[#FF2E88] rounded transition"
                        title="Delete profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Users size={40} />}
          title="No Curated Characters Found"
          description="Build character lore cards to link into the Lore connections interactive node map."
        />
      )}
    </div>
  )
}
