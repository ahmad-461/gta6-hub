"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Eye,
  UserCheck
} from "lucide-react"

export default function CharacterManagerPage() {
  const [characters, setCharacters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false })

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
      toast.success(`Character status updated to ${newStatus}!`)
      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this character?")) return
    try {
      const { error } = await supabase.from("characters").delete().eq("id", id)
      if (error) throw error
      toast.success("Character deleted successfully.")
      setCharacters((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete character.")
    }
  }

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Character Cast
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Create, edit and manage biographies and background lore for GTA 6 story characters.
          </p>
        </div>
        <Link
          href="/admin/characters/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
        >
          <Plus size={18} className="mr-2" />
          Add Character
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-card-bg border border-card-border p-4 rounded-xl flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search characters by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
          />
        </div>
      </div>

      {/* Grid of Characters */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredCharacters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCharacters.map((character) => {
            const stats = character.stats_json || {}
            const isPublished = character.status === "published"

            return (
              <div
                key={character.id}
                className="bg-card-bg border border-card-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-card-border/80 transition shadow-lg group"
              >
                {/* Image Section */}
                <div className="aspect-video bg-[#0b0a0e] relative overflow-hidden flex items-center justify-center border-b border-card-border">
                  {character.featured_image ? (
                    <img
                      src={character.featured_image}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Users size={40} className="text-foreground/20" />
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    isPublished ? "bg-neon-blue/15 text-neon-blue" : "bg-foreground/15 text-foreground/60"
                  }`}>
                    {character.status}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-grow space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-neon-pink transition">
                      {character.name}
                    </h2>
                    <p className="text-xs text-foreground/40 font-mono mt-0.5">/characters/{character.slug}</p>
                  </div>

                  {/* Lore attributes preview */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#100e16] p-3 rounded border border-card-border/55">
                    <div>
                      <p className="text-foreground/40 uppercase font-bold tracking-wider text-[9px]">Role</p>
                      <p className="text-white font-semibold truncate mt-0.5">{stats.role || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-foreground/40 uppercase font-bold tracking-wider text-[9px]">Voice Actor</p>
                      <p className="text-white font-semibold truncate mt-0.5">{stats.voice_actor || "N/A"}</p>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-card-border/30 mt-1">
                      <p className="text-foreground/40 uppercase font-bold tracking-wider text-[9px]">Affiliation</p>
                      <p className="text-white font-semibold truncate mt-0.5">{stats.affiliation || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-4 bg-[#110f17] border-t border-card-border/55 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(character.id, character.status)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-foreground/60 hover:text-white transition"
                    title={isPublished ? "Unpublish character" : "Publish character"}
                  >
                    {isPublished ? (
                      <>
                        <ToggleRight className="text-neon-blue h-5 w-5" />
                        <span>Published</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-foreground/30 h-5 w-5" />
                        <span>Draft</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/characters/${character.id}`}
                      className="p-2 bg-[#1a1822] border border-card-border hover:border-neon-blue/40 text-foreground/80 hover:text-white rounded transition"
                      title="Edit details"
                    >
                      <Edit2 size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(character.id)}
                      className="p-2 bg-[#1a1822] border border-card-border hover:border-neon-pink/40 text-foreground/85 hover:text-neon-pink rounded transition"
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
      ) : (
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl bg-card-bg/50">
          <Users size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No character profiles found matching search criteria.</p>
        </div>
      )}
    </div>
  )
}
