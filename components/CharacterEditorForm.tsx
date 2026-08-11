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
            onClick={() => router.push("/admin/characters")}
            className="p-2 bg-card-bg border border-card-border rounded-lg hover:bg-card-border/60 transition text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              {isEditing ? "Edit Character Profile" : "New Character Profile"}
            </h1>
            <p className="text-xs text-foreground/45 mt-0.5">
              {isEditing ? `Character ID: ${characterId}` : "Create biography/lore for a new cast member"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider disabled:opacity-50"
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
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/85 mb-1.5">Character Name</label>
              <input
                type="text"
                required
                placeholder="Lucia, Jason, etc..."
                value={name}
                onChange={handleNameChange}
                className="block w-full px-3.5 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground/85 mb-1.5">Slug URL</label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-card-border bg-[#0b0a0e] text-foreground/45 text-xs font-mono">
                  /characters/
                </span>
                <input
                  type="text"
                  required
                  placeholder="character-slug-url"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="block w-full px-3.5 py-2 bg-[#100e16] border border-card-border rounded-r-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Biography rich text editor */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-3">
            <label className="block text-sm font-semibold text-white">Biography & Background Lore</label>
            <TiptapEditor content={biography} onChange={setBiography} />
          </div>

          {/* Additional Lore Metadata */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Lore & Background Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Role / Function</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Protagonist, Sidekick, Antagonist..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Affiliation / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Leonida Syndicate, Vice City Gang..."
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Voice Actor / Model</label>
                <input
                  type="text"
                  placeholder="e.g. Manni L. Perez..."
                  value={voiceActor}
                  onChange={(e) => setVoiceActor(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">First Appearance</label>
                <input
                  type="text"
                  placeholder="e.g. Trailer 1 (December 2023)..."
                  value={firstAppearance}
                  onChange={(e) => setFirstAppearance(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue transition text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          {/* Status */}
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
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Featured Image (Avatar / Portrait) */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Character Portrait</h2>

            {featuredImage ? (
              <div className="space-y-3">
                <div className="aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden border border-card-border relative group">
                  <NextImage src={featuredImage} alt="Portrait" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-neon-pink font-bold text-xs"
                  >
                    <Trash size={16} className="mr-1" /> Remove Portrait
                  </button>
                </div>
                <p className="text-xs text-foreground/45 truncate bg-[#100e16] p-1.5 rounded border border-card-border/40 font-mono text-center">
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
                className="w-full aspect-square border-2 border-dashed border-card-border rounded-lg flex flex-col items-center justify-center text-foreground/50 hover:border-foreground/20 hover:text-white transition group bg-[#100e16]/40"
              >
                <Users size={28} className="mb-2 text-foreground/30 group-hover:text-neon-pink transition" />
                <span className="text-xs font-semibold">Select Portrait</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Portrait Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Portrait Image</h3>
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
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-card-border overflow-hidden">
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
