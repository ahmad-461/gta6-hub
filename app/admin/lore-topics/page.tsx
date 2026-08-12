"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Compass,
  Plus,
  Trash,
  Edit2,
  RefreshCw,
  Loader2,
  Save,
  MapPin,
  Tag,
  AlertCircle
} from "lucide-react"
import {
  getLoreTopicsAction,
  saveLoreTopicAction,
  deleteLoreTopicAction,
  rebuildLoreConnectionsAction
} from "@/app/actions/lore"

interface LoreTopic {
  id: string
  name: string
  type: "location" | "topic"
  description: string
  created_at: string
}

export default function AdminLoreTopicsPage() {
  const [topics, setTopics] = useState<LoreTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<"location" | "topic">("location")
  const [description, setDescription] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchTopics = async () => {
    setIsLoading(true)
    const res = await getLoreTopicsAction()
    setIsLoading(false)
    if (res.success && res.topics) {
      setTopics(res.topics as LoreTopic[])
    } else {
      toast.error(res.error || "Failed to load lore topics.")
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  const handleEdit = (topic: LoreTopic) => {
    setEditingId(topic.id)
    setName(topic.name)
    setType(topic.type)
    setDescription(topic.description || "")
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setName("")
    setType("location")
    setDescription("")
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a name.")
      return
    }

    setIsSaving(true)
    const res = await saveLoreTopicAction({
      id: editingId || undefined,
      name: name.trim(),
      type,
      description: description.trim()
    })
    setIsSaving(false)

    if (res.success) {
      toast.success(editingId ? "Lore topic updated!" : "New lore topic created!")
      setIsFormOpen(false)
      fetchTopics()
    } else {
      toast.error(res.error || "Failed to save lore topic.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lore topic? All associated connections will be updated.")) {
      return
    }

    const res = await deleteLoreTopicAction(id)
    if (res.success) {
      toast.success("Lore topic deleted!")
      fetchTopics()
    } else {
      toast.error(res.error || "Failed to delete lore topic.")
    }
  }

  const handleManualRebuild = async () => {
    setIsRebuilding(true)
    const res = await rebuildLoreConnectionsAction()
    setIsRebuilding(false)

    if (res.success) {
      toast.success("Lore graph connections successfully recalculated and cached!")
    } else {
      toast.error(res.error || "Failed to rebuild connections.")
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 w-full flex-grow">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-card-border pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <Compass className="w-5 h-5 text-neon-pink" />
            <span className="text-xs font-black tracking-widest text-neon-pink uppercase">
              LORE MAP GRAPH MONITOR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Lore Topics & Locations
          </h1>
          <p className="text-xs sm:text-sm text-foreground/45 mt-0.5">
            Manage locations and key semantic topics to build the interactive force connections graph.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRebuild}
            disabled={isRebuilding}
            className="px-4 py-2 bg-card-bg/40 border border-card-border hover:border-white/20 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-40"
          >
            {isRebuilding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Recalculate Graph</span>
          </button>

          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-neon-pink text-white text-xs font-black rounded-lg hover:brightness-110 transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(255,0,127,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Curated Topic</span>
          </button>
        </div>
      </div>

      {/* CRUD Form overlay or inline */}
      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4 animate-fadeIn">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-card-border pb-3">
            {editingId ? "Edit Lore Topic" : "Create New Lore Topic"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Topic/Location Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vice City, Hamlet, Port Gellhorn, Cartels..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-neon-pink text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="block w-full px-3.5 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-neon-pink"
              >
                <option value="location">Location (Physical Map Area)</option>
                <option value="topic">Topic (Theme, Event, Group)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Brief Description</label>
              <input
                type="text"
                placeholder="e.g. The central neon metropolitan hub..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-neon-pink text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-neon-pink text-white text-xs font-black rounded-lg hover:brightness-110 transition flex items-center space-x-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{editingId ? "Save Changes" : "Create Topic"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Topics list table */}
      <div className="bg-card-bg/60 border border-card-border rounded-xl overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col justify-center items-center space-y-4">
            <Loader2 className="w-10 h-10 text-neon-pink animate-spin" />
            <p className="text-xs text-foreground/40 font-mono">Loading curated topics...</p>
          </div>
        ) : topics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#120f17] border-b border-card-border text-[10px] font-black uppercase tracking-widest text-foreground/50">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Classification</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/40">
                {topics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6 font-extrabold text-white">{topic.name}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        topic.type === "location"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-neon-purple/10 text-neon-purple border border-neon-purple/20"
                      }`}>
                        {topic.type === "location" ? (
                          <>
                            <MapPin size={10} />
                            <span>Location</span>
                          </>
                        ) : (
                          <>
                            <Tag size={10} />
                            <span>Topic</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-foreground/60 max-w-xs truncate">{topic.description || "—"}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(topic)}
                        className="p-2 text-foreground/50 hover:text-white hover:bg-white/5 rounded-lg transition"
                        title="Edit Topic"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(topic.id)}
                        className="p-2 text-neon-pink hover:text-white hover:bg-neon-pink/10 rounded-lg transition"
                        title="Delete Topic"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-foreground/30 mx-auto" />
            <h4 className="text-sm font-bold text-white uppercase">No curated topics found</h4>
            <p className="text-xs text-foreground/40 max-w-sm mx-auto">
              Curated locations and topics provide the key node anchors for building co-occurrence links with database characters. Add some topics to begin!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
