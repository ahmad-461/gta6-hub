"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { toast } from "sonner"
import Papa from "papaparse"
import { logAdminActivity } from "@/lib/activity"
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
  X,
  Info,
  CheckSquare,
  Square,
  ArrowUpDown
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const [cheats, setCheats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // URL-persisted filter state or fallbacks
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [platformFilter, setPlatformFilter] = useState(searchParams.get("platform") || "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "")
  const [sortField, setSortField] = useState(searchParams.get("sortField") || "created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc")

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("query", searchQuery)
    if (platformFilter) params.set("platform", platformFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    if (sortField) params.set("sortField", sortField)
    if (sortOrder) params.set("sortOrder", sortOrder)

    router.replace(`/admin/cheats?${params.toString()}`)
  }, [searchQuery, platformFilter, categoryFilter, sortField, sortOrder, router])

  const fetchCheats = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("cheat_codes")
        .select("*")

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
      const target = cheats.find((c) => c.id === id)
      await logAdminActivity({
        action: "deleted",
        entityType: "cheat_code",
        entityId: id,
        entityTitle: target?.title || "Cheat Code"
      })

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

        await logAdminActivity({
          action: "updated",
          entityType: "cheat_code",
          entityId: currentId,
          entityTitle: title
        })

        toast.success("Cheat code updated successfully!")
      } else {
        const { data, error } = await supabase
          .from("cheat_codes")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (error) throw error

        await logAdminActivity({
          action: "created",
          entityType: "cheat_code",
          entityId: data.id,
          entityTitle: title
        })

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

            const { error } = await supabase
              .from("cheat_codes")
              .upsert(formattedCheats, { onConflict: "platform,code" })

            if (error) throw error

            await logAdminActivity({
              action: "created",
              entityType: "cheat_code",
              entityTitle: `Imported ${formattedCheats.length} cheats from CSV`
            })

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

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} cheat codes?`)) return
    try {
      for (const id of selectedIds) {
        const item = cheats.find((c) => c.id === id)
        await logAdminActivity({
          action: "deleted",
          entityType: "cheat_code",
          entityId: id,
          entityTitle: item?.title || "Bulk Deleted"
        })
      }

      const { error } = await supabase.from("cheat_codes").delete().in("id", selectedIds)
      if (error) throw error
      toast.success(`Successfully deleted ${selectedIds.length} cheat codes.`)
      setCheats((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected cheat codes.")
    }
  }

  const handleBulkVerify = async (val: boolean) => {
    if (selectedIds.length === 0) return
    try {
      const { error } = await supabase
        .from("cheat_codes")
        .update({ verified: val, updated_at: new Date().toISOString() })
        .in("id", selectedIds)

      if (error) throw error

      for (const id of selectedIds) {
        const item = cheats.find((c) => c.id === id)
        await logAdminActivity({
          action: "updated",
          entityType: "cheat_code",
          entityId: id,
          entityTitle: `${item?.title || "Cheat"} verification updated to ${val}`
        })
      }

      toast.success(`Updated verification status for ${selectedIds.length} cheat codes.`)
      setCheats((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, verified: val } : c))
      )
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Failed to verify cheat codes.")
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCheats.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCheats.map((c) => c.id))
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

  // Filtering & Sorting
  const filteredCheats = cheats
    .filter((cheat) => {
      const matchesSearch =
        (cheat.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cheat.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cheat.effect || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPlatform = platformFilter ? cheat.platform === platformFilter : true
      const matchesCategory = categoryFilter ? cheat.category === categoryFilter : true

      return matchesSearch && matchesPlatform && matchesCategory
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
            Cheat Code Manager
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Publish verified controller and console codes. Bulk-upsert platform keys using CSV templates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* CSV Bulk Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider rounded transition disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Upload size={14} className="mr-2 text-[#00E5FF]" />
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
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition"
          >
            <Plus size={18} className="mr-2" />
            Add Cheat
          </button>
        </div>
      </div>

      {/* CSV template instructions */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-4 rounded flex items-start space-x-3 text-xs text-[#9C8FAE]">
        <Info className="text-[#00E5FF] flex-shrink-0 mt-0.5" size={16} />
        <div>
          <p className="font-semibold text-white">CSV Format Instructions:</p>
          <p className="mt-1">
            Columns must match exactly: <code className="text-[#FF2E88] font-mono">platform,code,category,effect,verified</code>.
          </p>
          <p className="mt-0.5">
            Examples: <code className="text-[#00E5FF] font-mono">PS5,&quot;R1 R2 L1 ...&quot;,Weapons,&quot;Spawn RPG&quot;,true</code>
          </p>
          <p className="mt-0.5 font-semibold text-[#FF2E88] mt-1">
            * Upserts on (platform, code) as matching unique key. Duplicate keys will overwrite existing database records!
          </p>
        </div>
      </div>

      {/* Filters & Searches */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by code name, effect or combination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer"
          >
            <option value="">All Platforms</option>
            <option value="PS5">PS5</option>
            <option value="Xbox Series X">Xbox Series X</option>
            <option value="PC">PC</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer"
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

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FF2E88]/10 border border-[#FF2E88]/25 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#FF2E88] font-bold uppercase tracking-wider">
            {selectedIds.length} cheats selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkVerify(true)}
              className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black text-[10px] font-bold rounded uppercase tracking-wider transition"
            >
              Verify Selected
            </button>
            <button
              onClick={() => handleBulkVerify(false)}
              className="px-3 py-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-white/20 text-white text-[10px] font-bold rounded uppercase tracking-wider transition"
            >
              Unverify Selected
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

      {/* Cheats table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#00E5FF] h-8 w-8" />
        </div>
      ) : filteredCheats.length > 0 ? (
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-10">
                    <button onClick={handleSelectAll} className="text-[#9C8FAE]/60 hover:text-white transition">
                      {selectedIds.length === filteredCheats.length ? (
                        <CheckSquare size={18} className="text-[#FF2E88]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("title")}>
                    <span className="flex items-center space-x-1">
                      <span>Title / Effect</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Platform</th>
                  <th className="py-4 px-6">Cheat Code</th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("category")}>
                    <span className="flex items-center space-x-1">
                      <span>Category</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Verified</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,240,250,0.08)] text-xs">
                {filteredCheats.map((cheat) => {
                  const isSelected = selectedIds.includes(cheat.id)
                  return (
                    <tr key={cheat.id} className={`hover:bg-[#0B0710]/40 transition duration-150 ${isSelected ? "bg-[#FF2E88]/5" : ""}`}>
                      <td className="py-4 px-6">
                        <button onClick={() => handleSelectId(cheat.id)} className="text-[#9C8FAE]/60 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-[#FF2E88]" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{cheat.title}</p>
                        <p className="text-xs text-[#9C8FAE]/50 mt-0.5">{cheat.effect}</p>
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
                        <code className="px-2.5 py-1 bg-[#0B0710] rounded border border-[rgba(245,240,250,0.14)] text-[#FF2E88] text-xs font-mono select-all">
                          {cheat.code}
                        </code>
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE]/80">{cheat.category}</td>
                      <td className="py-4 px-6">
                        {cheat.verified ? (
                          <span className="inline-flex items-center text-[#00E5FF] text-xs font-bold uppercase tracking-wide">
                            <CheckCircle size={14} className="mr-1" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[#9C8FAE]/40 text-xs uppercase tracking-wide">
                            <XCircle size={14} className="mr-1" /> No
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(cheat)}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/50 text-[#9C8FAE] hover:text-white rounded transition"
                          title="Edit cheat"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cheat.id)}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#FF2E88]/50 text-[#9C8FAE] hover:text-[#FF2E88] rounded transition"
                          title="Delete cheat"
                        >
                          <Trash2 size={14} />
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
        <div className="text-center py-20 border border-dashed border-[rgba(245,240,250,0.14)] rounded bg-[#150C1F]/50">
          <Key size={40} className="mx-auto text-[#9C8FAE]/30 mb-3" />
          <p className="text-[#9C8FAE]/50 text-base">No cheat codes found matching search criteria.</p>
        </div>
      )}

      {/* Slide-over Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[rgba(245,240,250,0.14)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-anton uppercase tracking-wider">
                {isEditing ? "Edit Cheat Code" : "Add Cheat Code"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-[#9C8FAE] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Cheat Title / Short Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spawn Trashmaster, Restore Armor..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="PS5">PS5</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                    <option value="PC">PC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-sm text-white focus:outline-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Cheat Key Sequence / Code String</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L1 R1 SQUARE CIRCLE..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1">Detailed Effect Description</label>
                <textarea
                  required
                  placeholder="Explain exactly what happens when the code is entered..."
                  value={effect}
                  onChange={(e) => setEffect(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] min-h-[70px]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="rounded border-[rgba(245,240,250,0.14)] bg-[#0B0710] text-[#00E5FF] focus:ring-[#00E5FF] h-4 w-4 cursor-pointer"
                />
                <label htmlFor="verified" className="text-xs font-semibold text-[#9C8FAE] cursor-pointer select-none">
                  Mark this cheat code as Verified & Active
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[rgba(245,240,250,0.14)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-[#150C1F] hover:bg-white/5 text-white text-xs font-semibold rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white text-xs font-bold rounded transition uppercase tracking-wider"
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
