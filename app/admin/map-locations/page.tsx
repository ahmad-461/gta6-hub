"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import NextImage from "next/image"
import { z } from "zod"
import { toast } from "sonner"
import {
  MapPin,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Image as ImageIcon,
  Link as LinkIcon
} from "lucide-react"

// Zod Schema for validation
const locationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters" }),
  description: z.string().optional(),
  category: z.enum(["city", "landmark", "poi", "easter-egg"]),
  x_coord: z.number().min(0).max(100, { message: "X coordinate must be between 0% and 100%" }),
  y_coord: z.number().min(0).max(100, { message: "Y coordinate must be between 0% and 100%" }),
  image: z.string().optional(),
  status: z.enum(["confirmed", "speculated"]),
  related_article_ids: z.array(z.string()),
})

export default function MapLocationManagerPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<"city" | "landmark" | "poi" | "easter-egg">("poi")
  const [xCoord, setXCoord] = useState<number>(50)
  const [yCoord, setYCoord] = useState<number>(50)
  const [image, setImage] = useState("")
  const [status, setStatus] = useState<"confirmed" | "speculated">("speculated")
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([])

  // Search inside related articles / guides
  const [contentSearch, setContentSearch] = useState("")

  // Media Picker state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  useEffect(() => {
    fetchLocations()
    fetchRelatedOptions()
  }, [])

  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("map_locations")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setLocations(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load map locations.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRelatedOptions = async () => {
    try {
      const { data: articlesData } = await supabase.from("articles").select("id, title, slug")
      const { data: guidesData } = await supabase.from("guides").select("id, title, slug")
      setArticles(articlesData || [])
      setGuides(guidesData || [])
    } catch (err) {
      console.error("Failed to load options", err)
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!isEditing) {
      setSlug(slugify(val))
    }
  }

  const handleOpenNew = () => {
    setIsEditing(false)
    setCurrentId(null)
    setName("")
    setSlug("")
    setDescription("")
    setCategory("poi")
    setXCoord(50)
    setYCoord(50)
    setImage("")
    setStatus("speculated")
    setSelectedContentIds([])
    setIsOpen(true)
  }

  const handleOpenEdit = (loc: any) => {
    setIsEditing(true)
    setCurrentId(loc.id)
    setName(loc.name || "")
    setSlug(loc.slug || "")
    setDescription(loc.description || "")
    setCategory(loc.category || "poi")
    setXCoord(Number(loc.x_coord) || 50)
    setYCoord(Number(loc.y_coord) || 50)
    setImage(loc.image || "")
    setStatus(loc.status || "speculated")
    setSelectedContentIds(loc.related_article_ids || [])
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this map location?")) return
    try {
      const { error } = await supabase.from("map_locations").delete().eq("id", id)
      if (error) throw error
      toast.success("Location deleted successfully.")
      setLocations((prev) => prev.filter((loc) => loc.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete map location.")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = {
      name,
      slug,
      description: description || undefined,
      category,
      x_coord: Number(xCoord),
      y_coord: Number(yCoord),
      image: image || undefined,
      status,
      related_article_ids: selectedContentIds,
    }

    const validation = locationSchema.safeParse(formData)
    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        toast.error(`${err.path.join(".")}: ${err.message}`)
      })
      return
    }

    try {
      const payload = {
        name,
        slug,
        description,
        category,
        x_coord: Number(xCoord),
        y_coord: Number(yCoord),
        image: image || null,
        status,
        related_article_ids: selectedContentIds,
      }

      if (isEditing && currentId) {
        const { error } = await supabase
          .from("map_locations")
          .update(payload)
          .eq("id", currentId)

        if (error) throw error
        toast.success("Location updated successfully!")
      } else {
        const { error } = await supabase
          .from("map_locations")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success("Location created successfully!")
      }

      setIsOpen(false)
      fetchLocations()
    } catch (err: any) {
      toast.error(err.message || "Failed to save location.")
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

  const handleSelectImage = (url: string) => {
    setImage(url)
    setIsMediaModalOpen(false)
    toast.success("Image selected!")
  }

  // Related content selection
  const handleToggleContentSelection = (id: string) => {
    if (selectedContentIds.includes(id)) {
      setSelectedContentIds(selectedContentIds.filter((cid) => cid !== id))
    } else {
      setSelectedContentIds([...selectedContentIds, id])
    }
  }

  const allContentOptions = [
    ...articles.map((a) => ({ id: a.id, title: `[Article] ${a.title}`, slug: a.slug, type: "article" })),
    ...guides.map((g) => ({ id: g.id, title: `[Guide] ${g.title}`, slug: g.slug, type: "guide" })),
  ]

  const filteredContentOptions = allContentOptions.filter((opt) =>
    opt.title.toLowerCase().includes(contentSearch.toLowerCase())
  )

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      (loc.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.description || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter ? loc.category === categoryFilter : true
    const matchesStatus = statusFilter ? loc.status === statusFilter : true

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Interactive Map Editor
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Plot, position, and annotate points of interest across Leonida. Use percentage-based positioning for fluid layouts.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
        >
          <Plus size={18} className="mr-2" />
          Add Location
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card-bg border border-card-border p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by location name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="city">Cities</option>
            <option value="landmark">Landmarks</option>
            <option value="poi">Points of Interest</option>
            <option value="easter-egg">Easter Eggs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="speculated">Speculated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredLocations.length > 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f17] border-b border-card-border text-foreground/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Name / Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Coordinates (X / Y)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Links</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50 text-sm">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-[#110f17]/40 transition duration-150">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white">{loc.name}</p>
                      <p className="text-xs text-foreground/50 mt-0.5 max-w-xs truncate">{loc.description}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize text-xs font-semibold text-foreground/75">
                        {loc.category === "poi" ? "Point of Interest" : loc.category.replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      X: <span className="text-neon-pink">{loc.x_coord}%</span>, Y: <span className="text-neon-blue">{loc.y_coord}%</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        loc.status === "confirmed" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {loc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-xs font-mono text-foreground/50">
                        <LinkIcon size={12} className="mr-1" />
                        {loc.related_article_ids?.length || 0} items
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-blue/50 text-foreground/75 hover:text-white rounded transition"
                        title="Edit location"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-pink/50 text-foreground/75 hover:text-neon-pink rounded transition"
                        title="Delete location"
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
          <MapPin size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No map locations found. Create one now!</p>
        </div>
      )}

      {/* Slide-over Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0c12] border border-card-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                {isEditing ? "Edit Map Location" : "Add Map Location"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-foreground/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Port Gellhorn, Starfish Island..."
                    value={name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Slug URL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. port-gellhorn"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Description</label>
                <textarea
                  placeholder="Annotate this location with background details, lore, and speculation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="city">City / Town</option>
                    <option value="landmark">Landmark / Zone</option>
                    <option value="poi">Point of Interest</option>
                    <option value="easter-egg">Easter Egg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="speculated">Speculated</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4 bg-[#14121a] p-4 rounded-lg border border-card-border">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1 flex justify-between">
                    <span>X Coordinate (Horizontal %)</span>
                    <span className="text-neon-pink font-mono">{xCoord}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={xCoord}
                    onChange={(e) => setXCoord(Number(e.target.value))}
                    className="w-full h-1 bg-[#201c29] rounded-lg appearance-none cursor-pointer accent-neon-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1 flex justify-between">
                    <span>Y Coordinate (Vertical %)</span>
                    <span className="text-neon-blue font-mono">{yCoord}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={yCoord}
                    onChange={(e) => setYCoord(Number(e.target.value))}
                    className="w-full h-1 bg-[#201c29] rounded-lg appearance-none cursor-pointer accent-neon-blue"
                  />
                </div>
              </div>

              {/* Location Image */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Location Image</label>
                {image ? (
                  <div className="flex items-center gap-4 bg-[#14121a] p-3 rounded border border-card-border">
                    <div className="relative w-16 h-10 rounded overflow-hidden border border-card-border">
                      <NextImage src={image} alt="Location" fill className="object-cover" />
                    </div>
                    <span className="text-xs text-white truncate max-w-xs">{image}</span>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="ml-auto text-xs text-neon-pink font-bold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMediaModalOpen(true)
                      fetchMedia()
                    }}
                    className="w-full py-4 border-2 border-dashed border-card-border rounded-lg flex items-center justify-center text-foreground/50 hover:border-foreground/20 hover:text-white transition group bg-[#100e16]/40 text-xs"
                  >
                    <ImageIcon size={16} className="mr-2 text-foreground/30 group-hover:text-neon-pink transition" />
                    Select Location Thumbnail Image
                  </button>
                )}
              </div>

              {/* Related content Searchable Multi-Select */}
              <div className="space-y-2 border-t border-card-border/40 pt-4">
                <label className="block text-xs font-semibold text-foreground/80">Link Related Articles & Guides</label>
                <input
                  type="text"
                  placeholder="Filter articles & guides by title..."
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#100e16] border border-card-border rounded text-xs text-white placeholder-foreground/30 focus:outline-none"
                />

                <div className="max-h-40 overflow-y-auto border border-card-border/80 rounded bg-[#100e16] p-2 space-y-1.5">
                  {filteredContentOptions.map((opt) => {
                    const isChecked = selectedContentIds.includes(opt.id)
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleContentSelection(opt.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs transition ${
                          isChecked ? "bg-neon-pink/10 border-l-2 border-neon-pink text-white" : "text-foreground/75 hover:bg-card-bg hover:text-white"
                        }`}
                      >
                        <span className="truncate pr-4">{opt.title}</span>
                        <span className="text-[10px] font-mono text-foreground/40 font-bold shrink-0">
                          {isChecked ? "[Selected]" : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {selectedContentIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {selectedContentIds.map((cid) => {
                      const opt = allContentOptions.find((o) => o.id === cid)
                      return (
                        <span
                          key={cid}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-neon-blue/10 text-neon-blue text-[10px] font-bold font-mono border border-neon-blue/15"
                        >
                          {opt ? opt.title : cid}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedContentIds(selectedContentIds.filter((id) => id !== cid))
                            }}
                            className="ml-1.5 hover:text-white"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      )
                    })}
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
                  Save Location
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
              <h3 className="text-lg font-bold text-white">Choose Location Image</h3>
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
                      onClick={() => handleSelectImage(item.url)}
                      className="group border border-card-border hover:border-neon-blue bg-card-bg rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-card-border overflow-hidden">
                        <NextImage
                          src={item.url}
                          alt={item.alt_text || "Image Preview"}
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
