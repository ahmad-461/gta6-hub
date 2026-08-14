"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Papa from "papaparse"
import { logAdminActivity } from "@/lib/activity"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import {
  Folder,
  Plus,
  Trash,
  Edit2,
  Save,
  Search,
  ArrowUpDown,
  Download,
  AlertCircle,
  X,
  Loader2
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  created_at: string
}

export default function CategoryManagerPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Category>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState<string>("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, parent_id, created_at")
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories.")
    } finally {
      setIsLoading(false)
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

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setName(category.name)
    setSlug(category.slug)
    setDescription(category.description || "")
    setParentId(category.parent_id || "")
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setName("")
    setSlug("")
    setDescription("")
    setParentId("")
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a category name.")
      return
    }
    if (!slug.trim()) {
      toast.error("Please enter a valid slug.")
      return
    }

    // Safe recursion prevention
    if (editingId && parentId === editingId) {
      toast.error("A category cannot be its own parent.")
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        name: name.trim(),
        slug: slugify(slug),
        description: description.trim() || null,
        parent_id: parentId || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingId)

        if (error) throw error

        await logAdminActivity({
          action: "updated",
          entityType: "category",
          entityId: editingId,
          entityTitle: payload.name,
        })

        toast.success("Category updated successfully!")
      } else {
        const { data, error } = await supabase
          .from("categories")
          .insert(payload)
          .select("id")
          .single()

        if (error) throw error

        await logAdminActivity({
          action: "created",
          entityType: "category",
          entityId: data?.id,
          entityTitle: payload.name,
        })

        toast.success("Category created successfully!")
      }

      setIsFormOpen(false)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || "Failed to save category.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete the category "${category.name}"? This may affect any articles or guides associated with it.`
      )
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id)

      if (error) throw error

      await logAdminActivity({
        action: "deleted",
        entityType: "category",
        entityId: category.id,
        entityTitle: category.name,
      })

      toast.success(`Category "${category.name}" deleted successfully!`)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category.")
    }
  }

  const handleSort = (field: keyof Category) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const handleExportCSV = () => {
    if (filteredCategories.length === 0) {
      toast.error("No categories available to export.")
      return
    }

    const csvData = filteredCategories.map((cat) => ({
      ID: cat.id,
      Name: cat.name,
      Slug: cat.slug,
      Description: cat.description || "",
      Parent_ID: cat.parent_id || "None",
      Created_At: cat.created_at,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `categories_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Successfully exported ${filteredCategories.length} categories to CSV!`)
  }

  const filteredCategories = categories
    .filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
    .sort((a, b) => {
      const valA = a[sortField] || ""
      const valB = b[sortField] || ""
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })

  // Prevent self-referencing and nested recursive loops on Parent dropdown options
  const getParentOptions = () => {
    return categories.filter((cat) => !editingId || cat.id !== editingId)
  }

  return (
    <div className="space-y-8 font-mono max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <Folder className="w-5 h-5 text-neon-pink" />
            <span className="text-xs font-black tracking-widest text-[#FF2D8D] uppercase">
              Global Shared Taxonomy
            </span>
          </div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            Category Manager
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Manage site-wide content directories for articles and walkthrough guides.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/40 text-white font-bold text-xs uppercase tracking-wider rounded transition"
          >
            <Download size={14} className="mr-2 text-[#00E5FF]" />
            Export CSV
          </button>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150"
          >
            <Plus size={18} className="mr-2" />
            New Category
          </button>
        </div>
      </div>

      {/* CRUD Form overlay */}
      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[rgba(245,240,250,0.14)] pb-3 mb-2">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">
              {editingId ? "Edit Category Details" : "Create New Shared Category"}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-[#9C8FAE] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase">
                Category Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Map Intel, Advanced Tactics..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase">
                Slug URL
              </label>
              <input
                type="text"
                required
                placeholder="e.g. map-intel"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase">
                Description
              </label>
              <textarea
                placeholder="Provide a concise description of directory content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase">
                Parent Category (Optional)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00E5FF] cursor-pointer"
              >
                <option value="">-- No Parent (Top-level Category) --</option>
                {getParentOptions().map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[#9C8FAE] hover:text-white text-xs font-bold rounded hover:border-foreground/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white text-xs font-bold rounded transition flex items-center space-x-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{editingId ? "Update Category" : "Create Category"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Row */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8FAE]/40" />
          <input
            type="text"
            placeholder="Search by category name, slug, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
          />
        </div>
      </div>

      {/* Categories Table / List */}
      {isLoading ? (
        <LoadingSkeleton type="table" rows={6} cols={4} />
      ) : filteredCategories.length > 0 ? (
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/50 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th
                    className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none"
                    onClick={() => handleSort("name")}
                  >
                    <span className="flex items-center space-x-1">
                      <span>Name</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none"
                    onClick={() => handleSort("slug")}
                  >
                    <span className="flex items-center space-x-1">
                      <span>Slug</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Parent Directory</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,240,250,0.08)] text-xs">
                {filteredCategories.map((cat, idx) => {
                  const parentName =
                    categories.find((c) => c.id === cat.parent_id)?.name || "—"

                  return (
                    <tr
                      key={cat.id}
                      className={`transition duration-150 ${
                        idx % 2 === 0 ? "bg-[#150C1F]" : "bg-[#0B0710]"
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-white">
                        {cat.name}
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE] font-mono">
                        /{cat.slug}
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE]/70 max-w-xs truncate">
                        {cat.description || "—"}
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE] font-semibold">
                        {parentName}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/50 text-[#9C8FAE] hover:text-[#00E5FF] rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#FF2E88]/50 text-[#9C8FAE] hover:text-[#FF2E88] rounded transition"
                          title="Delete"
                        >
                          <Trash size={14} />
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
          icon={<Folder className="w-12 h-12 text-[#FF2D8D]/30 mx-auto" />}
          title="No Categories Found"
          description="Create shared categories under this panel to classify all articles and strategy guides."
        />
      )}
    </div>
  )
}
