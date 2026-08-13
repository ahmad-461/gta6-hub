"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import NextImage from "next/image"
import { z } from "zod"
import { toast } from "sonner"
import TiptapEditor from "@/components/TiptapEditor"
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Trash,
  Users,
  X
} from "lucide-react"

// Zod Schema for Character Form
const characterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters" }),
  biography: z.string().min(10, { message: "Biography must be at least 10 characters" }),
  role: z.string().min(1, { message: "Role is required" }),
  status: z.enum(["draft", "published", "archived"]),
  affiliation: z.string().optional(),
  voiceActor: z.string().optional(),
  firstAppearance: z.string().optional(),
  featuredImage: z.string().optional(),
})

interface CharacterEditorFormProps {
  characterId?: string
}

export default function CharacterEditorForm({ characterId }: CharacterEditorFormProps) {
  const router = useRouter()
  const isEditing = !!characterId

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

  // Fields State
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [biography, setBiography] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [affiliation, setAffiliation] = useState("")
  const [voiceActor, setVoiceActor] = useState("")
  const [firstAppearance, setFirstAppearance] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")

  // Media picker modal
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchCharacterData()
    }
  }, [characterId])

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!isEditing) {
      setSlug(slugify(val))
    }
  }

  const fetchCharacterData = async () => {
    try {
      const { data: character, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single()

      if (error) {
        toast.error("Failed to load character details.")
        router.push("/admin/characters")
        return
      }

      setName(character.name)
      setSlug(character.slug)
      setBiography(character.biography)
      setStatus(character.status || "draft")
      setFeaturedImage(character.featured_image || "")

      const stats = character.stats_json || {}
      setRole(stats.role || "")
      setAffiliation(stats.affiliation || "")
      setVoiceActor(stats.voice_actor || "")
      setFirstAppearance(stats.first_appearance || "")
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
    toast.success("Character avatar selected!")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const formData = {
      name,
      slug,
      biography,
      role,
      status,
      affiliation,
      voiceActor,
      firstAppearance,
      featuredImage,
    }

    const validation = characterSchema.safeParse(formData)
    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        toast.error(`${err.path.join(".")}: ${err.message}`)
      })
      setIsSaving(false)
      return
    }

    try {
      const statsJson = {
        role,
        affiliation: affiliation || null,
        voice_actor: voiceActor || null,
        first_appearance: firstAppearance || null,
      }

      const savePayload = {
        name,
        slug,
        biography,
        status,
        featured_image: featuredImage || null,
        stats_json: statsJson,
        updated_at: new Date().toISOString(),
      }

      if (isEditing) {
        const { error } = await supabase
          .from("characters")
          .update(savePayload)
          .eq("id", characterId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("characters")
          .insert({
            ...savePayload,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
      }

      toast.success(isEditing ? "Character updated successfully!" : "Character profile created successfully!")
      router.push("/admin/characters")
    } catch (err: any) {
      toast.error(err.message || "Failed to save character.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono">
        <Loader2 className="animate-spin text-orange h-8 w-8" />
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
            onClick={() => router.push("/admin/characters")}
            className="p-2 bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded hover:bg-ink transition text-paper-dim hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-normal text-white sm:text-3xl font-anton uppercase tracking-wider">
              {isEditing ? "Edit Character" : "New Character"}
            </h1>
            <p className="text-xs text-paper-dim mt-0.5">
              {isEditing ? `Character ID: ${characterId}` : "Create biography/lore for a new cast member"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-magenta hover:bg-magenta/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {isEditing ? "Update Character" : "Save & Create"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main content column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name & Slug */}
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <div>
              <label className="block text-xs font-semibold text-paper-dim uppercase tracking-wider mb-1.5">Character Name</label>
              <input
                type="text"
                required
                placeholder="Lucia, Jason, etc..."
                value={name}
                onChange={handleNameChange}
                className="block w-full px-3.5 py-2.5 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9E9EA8]/40 focus:outline-none focus:ring-1 focus:ring-orange transition text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-paper-dim uppercase tracking-wider mb-1.5">Slug URL</label>
              <div className="flex rounded shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-[rgba(245,240,250,0.14)] bg-ink text-paper-dim/45 text-xs font-mono">
                  /characters/
                </span>
                <input
                  type="text"
                  required
                  placeholder="character-slug-url"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="block w-full px-3.5 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded-r text-white placeholder-[#9E9EA8]/40 focus:outline-none focus:ring-1 focus:ring-orange transition text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Biography rich text editor */}
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-3">
            <label className="block text-xs font-semibold text-white uppercase tracking-wider">Biography & Background Lore</label>
            <TiptapEditor content={biography} onChange={setBiography} />
          </div>

          {/* Additional Lore Metadata */}
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Lore & Background Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-paper-dim mb-1">Role / Function</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Protagonist, Sidekick, Antagonist..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange transition text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-dim mb-1">Affiliation / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Leonida Syndicate, Vice City Gang..."
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange transition text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-dim mb-1">Voice Actor / Model</label>
                <input
                  type="text"
                  placeholder="e.g. Manni L. Perez..."
                  value={voiceActor}
                  onChange={(e) => setVoiceActor(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange transition text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-dim mb-1">First Appearance</label>
                <input
                  type="text"
                  placeholder="e.g. Trailer 1 (December 2023)..."
                  value={firstAppearance}
                  onChange={(e) => setFirstAppearance(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange transition text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Publishing Status</h2>
            <div>
              <label className="block text-xs font-semibold text-paper-dim mb-1.5 uppercase tracking-wider">Visibility Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange cursor-pointer font-semibold"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Featured Image (Avatar / Portrait) */}
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-[rgba(245,240,250,0.14)] pb-3 uppercase tracking-wider">Character Portrait</h2>

            {featuredImage ? (
              <div className="space-y-3">
                <div className="aspect-square max-w-[200px] mx-auto rounded overflow-hidden border border-[rgba(245,240,250,0.14)] relative group">
                  <NextImage src={featuredImage} alt="Portrait" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-magenta font-bold text-xs"
                  >
                    <Trash size={16} className="mr-1" /> Remove Portrait
                  </button>
                </div>
                <p className="text-[10px] text-paper-dim/45 truncate bg-ink p-1.5 rounded border border-[rgba(245,240,250,0.08)] font-mono text-center">
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
                className="w-full aspect-square border border-dashed border-[rgba(245,240,250,0.14)] rounded flex flex-col items-center justify-center text-paper-dim/50 hover:border-paper-dim/20 hover:text-white transition group bg-ink/40"
              >
                <Users size={28} className="mb-2 text-paper-dim/30 group-hover:text-magenta transition" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Select Portrait</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Portrait Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[rgba(245,240,250,0.14)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-anton uppercase tracking-wider">Select Portrait Image</h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="text-paper-dim hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-ink/50">
              {isLoadingMedia ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-orange h-8 w-8" />
                </div>
              ) : mediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectFeaturedImage(item.url)}
                      className="group border border-[rgba(245,240,250,0.14)] hover:border-orange bg-ink-2 rounded overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-[rgba(245,240,250,0.14)] overflow-hidden">
                        <NextImage
                          src={item.url}
                          alt={item.alt_text || "Portrait option"}
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
                  <p className="text-xs text-paper-dim">No media found. Upload media in the Media Library first!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
