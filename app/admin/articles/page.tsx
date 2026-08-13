"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Copy,
  Edit2,
  Loader2,
  FolderOpen,
  CheckSquare,
  Square
} from "lucide-react"

export default function ArticleManagerPage() {
  console.log(`[AUTH REDIRECT SOURCE] destination-page (articles page rendering client-side)`)
  const [articles, setArticles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedAuthor, setSelectedAuthor] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

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
        .order("created_at", { ascending: false })

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
      toast.success(`Successfully published ${selectedIds.length} articles!`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to publish selected articles.")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected articles?`)) return
    try {
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
        content: article.excerpt || "Duplicated content...", // Let's fetch full content if available or use a copy placeholder
        excerpt: article.excerpt,
        category: article.category,
        status: "draft",
        featured_image: article.featured_image,
        author_id: article.author_id,
      }

      // Fetch the original full content to duplicate perfectly
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

  // Filter logic
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true

    // Status check
    let articleStatus = article.status
    if (article.status === "published" && article.published_at && new Date(article.published_at) > new Date()) {
      articleStatus = "scheduled"
    }
    const matchesStatus = selectedStatus ? articleStatus === selectedStatus : true

    const matchesAuthor = selectedAuthor ? article.author_id === selectedAuthor : true

    // Date check
    let matchesDate = true
    const articleDate = new Date(article.created_at)
    if (startDate) {
      matchesDate = matchesDate && articleDate >= new Date(startDate)
    }
    if (endDate) {
      matchesDate = matchesDate && articleDate <= new Date(endDate + "T23:59:59")
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesAuthor && matchesDate
  })

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            Articles
          </h1>
          <p className="mt-2 text-xs text-paper-dim">
            Manage your news, announcements, and analytical content pieces.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          prefetch={false}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-magenta hover:bg-magenta/90 text-white font-bold text-xs uppercase tracking-wider rounded transition duration-150"
        >
          <Plus size={18} className="mr-2" />
          New Article
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9E9EA8]/40 focus:outline-none focus:ring-1 focus:ring-orange transition text-xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange text-xs cursor-pointer font-bold"
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
            className="px-3 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange text-xs cursor-pointer font-bold"
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
            className="px-3 py-2 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-white focus:outline-none focus:ring-1 focus:ring-orange text-xs cursor-pointer font-bold"
          >
            <option value="">All Authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-[rgba(245,240,250,0.08)]">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-paper-dim uppercase tracking-wider font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-xs text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-paper-dim uppercase tracking-wider font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-xs text-white focus:outline-none"
            />
          </div>
          {(startDate || endDate || selectedCategory || selectedStatus || selectedAuthor || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("")
                setSelectedStatus("")
                setSelectedAuthor("")
                setStartDate("")
                setEndDate("")
              }}
              className="text-xs font-bold text-magenta hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-magenta/10 border border-magenta/25 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-magenta font-bold uppercase tracking-wider">
            {selectedIds.length} articles selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkPublish}
              className="px-3 py-1.5 bg-orange hover:bg-orange/90 text-black text-[10px] font-bold rounded uppercase tracking-wider transition"
            >
              Publish Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-magenta hover:bg-magenta/90 text-white text-[10px] font-bold rounded uppercase tracking-wider transition"
            >
              Delete Selected
            </button>
            <select
              onChange={(e) => {
                handleBulkChangeCategory(e.target.value)
                e.target.value = ""
              }}
              className="px-3 py-1.5 bg-ink border border-[rgba(245,240,250,0.14)] rounded text-[10px] text-white focus:outline-none cursor-pointer"
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange h-8 w-8" />
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ink border-b border-[rgba(245,240,250,0.14)] text-paper-dim/50 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-4 px-6 w-10">
                    <button onClick={handleSelectAll} className="text-paper-dim/60 hover:text-white transition">
                      {selectedIds.length === filteredArticles.length ? (
                        <CheckSquare size={18} className="text-magenta" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Author</th>
                  <th className="py-4 px-6">Created Date</th>
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
                  let statusClass = "bg-paper-dim/10 text-paper-dim"

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
                    statusClass = "bg-paper-dim/5 text-paper-dim/40"
                  }

                  return (
                    <tr
                      key={article.id}
                      className={`transition duration-150 ${
                        idx % 2 === 0 ? "bg-ink-2" : "bg-ink"
                      } ${isSelected ? "bg-magenta/5" : ""}`}
                    >
                      <td className="py-4 px-6">
                        <button onClick={() => handleSelectId(article.id)} className="text-paper-dim/60 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-magenta" />
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
                          <p className="text-[10px] text-paper-dim/40 font-mono truncate mt-0.5">
                            /{article.slug}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-paper-dim">{categoryName}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-paper-dim">{authorName}</td>
                      <td className="py-4 px-6 text-paper-dim/60">
                        {new Date(article.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          prefetch={false}
                          className="inline-flex p-1.5 bg-ink border border-[rgba(245,240,250,0.14)] hover:border-orange/50 text-paper-dim hover:text-orange rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(article)}
                          className="inline-flex p-1.5 bg-ink border border-[rgba(245,240,250,0.14)] hover:border-magenta/50 text-paper-dim hover:text-magenta rounded transition"
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
        <div className="text-center py-20 border border-dashed border-[rgba(245,240,250,0.14)] rounded">
          <FolderOpen size={40} className="mx-auto text-paper-dim/30 mb-3" />
          <p className="text-paper-dim text-xs">No articles found matching search criteria.</p>
        </div>
      )}
    </div>
  )
}
