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
  FolderOpen,
  CheckSquare,
  Square,
  Download,
  Trash,
  ArrowUpDown
} from "lucide-react"

export default function ArticleManagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [articles, setArticles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Search from URL query params or fallback
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
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
    if (selectedCategory) params.set("category", selectedCategory)
    if (selectedStatus) params.set("status", selectedStatus)
    if (selectedAuthor) params.set("author", selectedAuthor)
    if (sortField) params.set("sortField", sortField)
    if (sortOrder) params.set("sortOrder", sortOrder)

    router.replace(`/admin/articles?${params.toString()}`)
  }, [searchQuery, selectedCategory, selectedStatus, selectedAuthor, sortField, sortOrder, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch articles
      const { data: articlesData, error: articlesErr } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          status,
          category,
          featured_image,
          published_at,
          created_at,
          updated_at,
          author_id
        `)

      if (articlesErr) throw articlesErr

      // Fetch categories
      const { data: categoriesData } = await supabase.from("categories").select("id, name")
      // Fetch profiles (authors)
      const { data: authorsData } = await supabase.from("profiles").select("id, name")

      setArticles(articlesData || [])
      setCategories(categoriesData || [])
      setAuthors(authorsData || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load articles.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Bulk Actions
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return
    try {
      const { error } = await supabase
        .from("articles")
        .update({ status: "published", published_at: new Date().toISOString() })
        .in("id", selectedIds)

      if (error) throw error

      for (const id of selectedIds) {
        const item = articles.find((a) => a.id === id)
        await logAdminActivity({
          action: "published",
          entityType: "article",
          entityId: id,
          entityTitle: item?.title || "Article Bulk Published"
        })
      }

      toast.success(`Successfully published ${selectedIds.length} articles!`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to publish selected articles.")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected articles?`)) return
    try {
      for (const id of selectedIds) {
        const item = articles.find((a) => a.id === id)
        await logAdminActivity({
          action: "deleted",
          entityType: "article",
          entityId: id,
          entityTitle: item?.title || "Article Bulk Deleted"
        })
      }

      const { error } = await supabase
        .from("articles")
        .delete()
        .in("id", selectedIds)

      if (error) throw error
      toast.success(`Successfully deleted ${selectedIds.length} articles.`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected articles.")
    }
  }

  const handleBulkChangeCategory = async (catId: string) => {
    if (selectedIds.length === 0 || !catId) return
    try {
      const { error } = await supabase
        .from("articles")
        .update({ category: catId })
        .in("id", selectedIds)

      if (error) throw error

      for (const id of selectedIds) {
        const item = articles.find((a) => a.id === id)
        await logAdminActivity({
          action: "updated",
          entityType: "article",
          entityId: id,
          entityTitle: `${item?.title || "Article"} moved category`
        })
      }

      toast.success("Successfully updated category for selected articles.")
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to change category.")
    }
  }

  // One-click duplicate article
  const handleDuplicate = async (article: any) => {
    try {
      const uniqueSuffix = Date.now().toString().slice(-4)
      const duplicatedArticle = {
        title: `${article.title} (Copy)`,
        slug: `${article.slug}-copy-${uniqueSuffix}`,
        content: article.excerpt || "Duplicated content...",
        excerpt: article.excerpt,
        category: article.category,
        status: "draft",
        featured_image: article.featured_image,
        author_id: article.author_id,
      }

      const { data: fullOriginal } = await supabase
        .from("articles")
        .select("content, seo_title, seo_description")
        .eq("id", article.id)
        .single()

      if (fullOriginal) {
        duplicatedArticle.content = fullOriginal.content
      }

      const { data, error } = await supabase
        .from("articles")
        .insert(duplicatedArticle)
        .select()
        .single()

      if (error) throw error

      await logAdminActivity({
        action: "created",
        entityType: "article",
        entityId: data.id,
        entityTitle: duplicatedArticle.title
      })

      toast.success("Article duplicated successfully as draft!")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate article.")
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredArticles.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredArticles.map((a) => a.id))
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
  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory ? article.category === selectedCategory : true

      let articleStatus = article.status
      if (article.status === "published" && article.published_at && new Date(article.published_at) > new Date()) {
        articleStatus = "scheduled"
      }
      const matchesStatus = selectedStatus ? articleStatus === selectedStatus : true

      const matchesAuthor = selectedAuthor ? article.author_id === selectedAuthor : true

      return matchesSearch && matchesCategory && matchesStatus && matchesAuthor
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
    if (filteredArticles.length === 0) {
      toast.error("No articles available in the current filtered state to export.")
      return
    }

    const csvData = filteredArticles.map((art) => ({
      ID: art.id,
      Title: art.title,
      Slug: art.slug,
      Excerpt: art.excerpt || "",
      Status: art.status,
      Category: categories.find((c) => c.id === art.category)?.name || "Uncategorized",
      Author: authors.find((a) => a.id === art.author_id)?.name || "System",
      Created_At: art.created_at,
      Updated_At: art.updated_at,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `articles_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Successfully exported ${filteredArticles.length} articles to CSV!`)
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            Articles
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Manage your news, announcements, and analytical content pieces.
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
            href="/admin/articles/new"
            prefetch={false}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150"
          >
            <Plus size={18} className="mr-2" />
            New Article
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
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs cursor-pointer font-bold"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs cursor-pointer font-bold"
          >
            <option value="">All Authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FF2E88]/10 border border-[#FF2E88]/25 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#FF2E88] font-bold uppercase tracking-wider">
            {selectedIds.length} articles selected
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Articles Table */}
      {isLoading ? (
        <LoadingSkeleton type="table" rows={6} cols={5} />
      ) : filteredArticles.length > 0 ? (
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/50 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-4 px-6 w-10">
                    <button onClick={handleSelectAll} className="text-[#9C8FAE]/60 hover:text-white transition">
                      {selectedIds.length === filteredArticles.length ? (
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
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("status")}>
                    <span className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Author</th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none" onClick={() => handleSort("created_at")}>
                    <span className="flex items-center space-x-1">
                      <span>Created Date</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,240,250,0.08)] text-xs">
                {filteredArticles.map((article, idx) => {
                  const isSelected = selectedIds.includes(article.id)
                  const categoryName = categories.find((c) => c.id === article.category)?.name || "Uncategorized"
                  const authorName = authors.find((a) => a.id === article.author_id)?.name || "System"

                  // Determine status badge
                  let statusLabel = "Draft"
                  let statusClass = "bg-[#9C8FAE]/10 text-[#9C8FAE]"

                  if (article.status === "published") {
                    if (article.published_at && new Date(article.published_at) > new Date()) {
                      statusLabel = "Scheduled"
                      statusClass = "bg-amber-500/10 text-amber-500"
                    } else {
                      statusLabel = "Published"
                      statusClass = "bg-emerald-500/10 text-emerald-500"
                    }
                  } else if (article.status === "archived") {
                    statusLabel = "Archived"
                    statusClass = "bg-[#9C8FAE]/5 text-[#9C8FAE]/40"
                  }

                  return (
                    <tr
                      key={article.id}
                      className={`transition duration-150 ${
                        idx % 2 === 0 ? "bg-[#150C1F]" : "bg-[#0B0710]"
                      } ${isSelected ? "bg-[#FF2E88]/5" : ""}`}
                    >
                      <td className="py-4 px-6">
                        <button onClick={() => handleSelectId(article.id)} className="text-[#9C8FAE]/60 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-[#FF2E88]" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="max-w-xs md:max-w-sm">
                          <p className="truncate" title={article.title}>
                            {article.title}
                          </p>
                          <p className="text-[10px] text-[#9C8FAE]/40 font-mono truncate mt-0.5">
                            /{article.slug}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE]">{categoryName}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#9C8FAE]">{authorName}</td>
                      <td className="py-4 px-6 text-[#9C8FAE]/60">
                        {new Date(article.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          prefetch={false}
                          className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/50 text-[#9C8FAE] hover:text-[#00E5FF] rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(article)}
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
          icon={<FolderOpen size={40} />}
          title="No Articles Found"
          description="Create your first published or draft article to populate the database."
        />
      )}
    </div>
  )
}
