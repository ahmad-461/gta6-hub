"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { toast } from "sonner"
import Papa from "papaparse"
import {
  Key,
  Plus,
  Search,
  Upload,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  Check,
  X,
  RefreshCw,
  Info
} from "lucide-react"

// Zod Schema for single cheat code
const cheatSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  platform: z.enum(["PS5", "Xbox Series X", "PC"]),
  code: z.string().min(1, { message: "Code cannot be empty" }),
  category: z.enum(["Health", "Weapons", "Vehicles", "Wanted Level", "Weather", "Other"]),
  effect: z.string().min(3, { message: "Effect description must be at least 3 characters" }),
  verified: z.boolean(),
})

export default function CheatCodeManagerPage() {
  const [cheats, setCheats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  // Form Modals / Sidebar State
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = useState("")
  const [platform, setPlatform] = useState<"PS5" | "Xbox Series X" | "PC">("PS5")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState<"Health" | "Weapons" | "Vehicles" | "Wanted Level" | "Weather" | "Other">("Health")
  const [effect, setEffect] = useState("")
  const [verified, setVerified] = useState(false)

  // CSV file ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    fetchCheats()
  }, [])

  const fetchCheats = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("cheat_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCheats(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load cheat codes.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenNew = () => {
    setIsEditing(false)
    setCurrentId(null)
    setTitle("")
    setPlatform("PS5")
    setCode("")
    setCategory("Health")
    setEffect("")
    setVerified(false)
    setIsOpen(true)
  }

  const handleOpenEdit = (cheat: any) => {
    setIsEditing(true)
    setCurrentId(cheat.id)
    setTitle(cheat.title || "")
    setPlatform(cheat.platform as any)
    setCode(cheat.code || "")
    setCategory(cheat.category as any)
    setEffect(cheat.effect || "")
    setVerified(cheat.verified || false)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cheat code?")) return
    try {
      const { error } = await supabase.from("cheat_codes").delete().eq("id", id)
      if (error) throw error
      toast.success("Cheat code deleted.")
      setCheats((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete cheat code.")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = { title, platform, code, category, effect, verified }
    const validation = cheatSchema.safeParse(formData)

    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        toast.error(`${err.path.join(".")}: ${err.message}`)
      })
      return
    }

    try {
      const payload = {
        title,
        platform,
        code,
        category,
        effect,
        verified,
        updated_at: new Date().toISOString(),
      }

      if (isEditing && currentId) {
        const { error } = await supabase
          .from("cheat_codes")
          .update(payload)
          .eq("id", currentId)

        if (error) throw error
        toast.success("Cheat code updated successfully!")
      } else {
        const { error } = await supabase
          .from("cheat_codes")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success("Cheat code created successfully!")
      }

      setIsOpen(false)
      fetchCheats()
    } catch (err: any) {
      toast.error(err.message || "Failed to save cheat code.")
    }
  }

  // Handle CSV Bulk Upload via PapaParse
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsImporting(true)

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as any[]
            if (rows.length === 0) {
              toast.error("CSV file is empty or formatted incorrectly.")
              setIsImporting(false)
              return
            }

            // Map and format rows for bulk upsert
            const formattedCheats = rows.map((row, idx) => {
              // Ensure fields exist
              const platformVal = row.platform?.trim() || "PS5"
              const codeVal = row.code?.trim() || ""
              const categoryVal = row.category?.trim() || "Other"
              const effectVal = row.effect?.trim() || ""
              const verifiedVal = row.verified?.trim()?.toLowerCase() === "true" || row.verified?.trim() === "1"

              if (!codeVal || !effectVal) {
                throw new Error(`Row ${idx + 2} is missing required 'code' or 'effect' values.`)
              }

              return {
                title: effectVal,
                platform: platformVal,
                code: codeVal,
                category: categoryVal,
                effect: effectVal,
                verified: verifiedVal,
                updated_at: new Date().toISOString(),
              }
            })

            // Bulk upsert into cheat_codes with onConflict matching unique constraint
            const { error } = await supabase
              .from("cheat_codes")
              .upsert(formattedCheats, { onConflict: "platform,code" })

            if (error) throw error

            toast.success(`Successfully imported/updated ${formattedCheats.length} cheat codes via CSV!`)
            fetchCheats()
          } catch (err: any) {
            toast.error(err.message || "Failed to process CSV file.")
          } finally {
            setIsImporting(false)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }
        },
        error: (err) => {
          toast.error(`CSV Parsing error: ${err.message}`)
          setIsImporting(false)
        },
      })
    }
  }

  // Filtering
  const filteredCheats = cheats.filter((cheat) => {
    const matchesSearch =
      (cheat.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cheat.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cheat.effect || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPlatform = platformFilter ? cheat.platform === platformFilter : true
    const matchesCategory = categoryFilter ? cheat.category === categoryFilter : true

    return matchesSearch && matchesPlatform && matchesCategory
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Cheat Code Manager
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Publish verified controller and console codes. Bulk-upsert platform keys using CSV templates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* CSV Bulk Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-card-bg border border-card-border hover:border-foreground/20 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Upload size={18} className="mr-2 text-neon-blue" />
            )}
            Bulk CSV Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
          >
            <Plus size={18} className="mr-2" />
            Add Cheat
          </button>
        </div>
      </div>

      {/* CSV template instructions */}
      <div className="bg-[#110f17] border border-card-border p-4 rounded-xl flex items-start space-x-3 text-xs text-foreground/60">
        <Info className="text-neon-blue flex-shrink-0 mt-0.5" size={16} />
        <div>
          <p className="font-semibold text-white">CSV Format Instructions:</p>
          <p className="mt-1">
            Columns must match exactly: <code className="text-neon-pink font-mono">platform,code,category,effect,verified</code>.
          </p>
          <p className="mt-0.5">
            Examples: <code className="text-neon-blue font-mono">PS5,&quot;R1 R2 L1 ...&quot;,Weapons,&quot;Spawn RPG&quot;,true</code>
          </p>
          <p className="mt-0.5 font-semibold text-neon-pink mt-1">
            * Upserts on (platform, code) as matching unique key. Duplicate keys will overwrite existing database records!
          </p>
        </div>
      </div>

      {/* Filters & Searches */}
      <div className="bg-card-bg border border-card-border p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by code name, effect or combination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="">All Platforms</option>
            <option value="PS5">PS5</option>
            <option value="Xbox Series X">Xbox Series X</option>
            <option value="PC">PC</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Health">Health</option>
            <option value="Weapons">Weapons</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Wanted Level">Wanted Level</option>
            <option value="Weather">Weather</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Cheats table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredCheats.length > 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f17] border-b border-card-border text-foreground/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Title / Effect</th>
                  <th className="py-4 px-6">Platform</th>
                  <th className="py-4 px-6">Cheat Code</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Verified</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50 text-sm">
                {filteredCheats.map((cheat) => (
                  <tr key={cheat.id} className="hover:bg-[#110f17]/40 transition duration-150">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white">{cheat.title}</p>
                      <p className="text-xs text-foreground/50 mt-0.5">{cheat.effect}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                        cheat.platform === "PS5"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : cheat.platform === "PC"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-green-500/10 text-green-400 border-green-500/20"
                      }`}>
                        {cheat.platform}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <code className="px-2.5 py-1 bg-[#100e16] rounded border border-card-border text-neon-pink text-xs font-mono select-all">
                        {cheat.code}
                      </code>
                    </td>
                    <td className="py-4 px-6 text-foreground/80">{cheat.category}</td>
                    <td className="py-4 px-6">
                      {cheat.verified ? (
                        <span className="inline-flex items-center text-neon-blue text-xs font-bold uppercase tracking-wide">
                          <CheckCircle size={14} className="mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-foreground/40 text-xs uppercase tracking-wide">
                          <XCircle size={14} className="mr-1" /> No
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(cheat)}
                        className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-blue/50 text-foreground/75 hover:text-white rounded transition"
                        title="Edit cheat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cheat.id)}
                        className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-pink/50 text-foreground/75 hover:text-neon-pink rounded transition"
                        title="Delete cheat"
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
          <Key size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No cheat codes found matching search criteria.</p>
        </div>
      )}

      {/* Slide-over Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isEditing ? "Edit Cheat Code" : "Add Cheat Code"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-foreground/60 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Cheat Title / Short Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spawn Trashmaster, Restore Armor..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="PS5">PS5</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                    <option value="PC">PC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Health">Health</option>
                    <option value="Weapons">Weapons</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Wanted Level">Wanted Level</option>
                    <option value="Weather">Weather</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Cheat Key Sequence / Code String</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L1 R1 SQUARE CIRCLE..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Detailed Effect Description</label>
                <textarea
                  required
                  placeholder="Explain exactly what happens when the code is entered..."
                  value={effect}
                  onChange={(e) => setEffect(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue min-h-[70px]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="rounded border-card-border bg-[#100e16] text-neon-blue focus:ring-neon-blue h-4 w-4 cursor-pointer"
                />
                <label htmlFor="verified" className="text-xs font-semibold text-foreground/80 cursor-pointer select-none">
                  Mark this cheat code as Verified & Active
                </label>
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
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
