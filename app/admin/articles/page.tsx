"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  FileText,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  Eye,
  AlertTriangle,
  FolderOpen,
  Calendar,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Articles
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Manage your news, announcements, and analytical content pieces.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
        >
          <Plus size={18} className="mr-2" />
          New Article
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue text-sm cursor-pointer"
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
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue text-sm cursor-pointer"
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
            className="px-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue text-sm cursor-pointer"
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-card-border/30">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-foreground/50">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-[#100e16] border border-card-border rounded text-xs text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-foreground/50">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-[#100e16] border border-card-border rounded text-xs text-white focus:outline-none"
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
              className="text-xs font-semibold text-neon-pink hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-neon-pink/10 border border-neon-pink/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-neon-pink font-semibold">
            {selectedIds.length} articles selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkPublish}
              className="px-3 py-1.5 bg-neon-blue hover:bg-neon-blue/90 text-black text-xs font-bold rounded uppercase transition"
            >
              Publish Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-neon-pink hover:bg-neon-pink/90 text-white text-xs font-bold rounded uppercase transition"
            >
              Delete Selected
            </button>
            <select
              onChange={(e) => {
                handleBulkChangeCategory(e.target.value)
                e.target.value = ""
              }}
              className="px-3 py-1.5 bg-[#100e16] border border-card-border rounded text-xs text-white focus:outline-none cursor-pointer"
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
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f17] border-b border-card-border text-foreground/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-10">
                    <button onClick={handleSelectAll} className="text-foreground/60 hover:text-white transition">
                      {selectedIds.length === filteredArticles.length ? (
                        <CheckSquare size={18} className="text-neon-pink" />
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
              <tbody className="divide-y divide-card-border/50 text-sm">
                {filteredArticles.map((article) => {
                  const isSelected = selectedIds.includes(article.id)
                  const categoryName = categories.find((c) => c.id === article.category)?.name || "Uncategorized"
                  const authorName = authors.find((a) => a.id === article.author_id)?.name || "System"

                  // Determine status badge
                  let statusLabel = "Draft"
                  let statusClass = "bg-foreground/10 text-foreground/60"

                  if (article.status === "published") {
                    if (article.published_at && new Date(article.published_at) > new Date()) {
                      statusLabel = "Scheduled"
                      statusClass = "bg-neon-yellow/15 text-neon-yellow"
                    } else {
                      statusLabel = "Published"
                      statusClass = "bg-neon-blue/15 text-neon-blue"
                    }
                  } else if (article.status === "archived") {
                    statusLabel = "Archived"
                    statusClass = "bg-foreground/5 text-foreground/40"
                  }

                  return (
                    <tr
                      key={article.id}
                      className={`hover:bg-[#110f17]/40 transition duration-150 ${
                        isSelected ? "bg-neon-pink/5" : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <button onClick={() => handleSelectId(article.id)} className="text-foreground/60 hover:text-white transition">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-neon-pink" />
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
                          <p className="text-xs text-foreground/40 font-mono truncate mt-0.5">
                            /{article.slug}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-foreground/80">{categoryName}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-foreground/80">{authorName}</td>
                      <td className="py-4 px-6 text-foreground/60">
                        {new Date(article.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-blue/50 text-foreground/75 hover:text-neon-blue rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(article)}
                          className="inline-flex p-1.5 bg-[#1a1822] border border-card-border hover:border-neon-purple/50 text-foreground/75 hover:text-neon-purple rounded transition"
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
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl bg-card-bg/50">
          <FolderOpen size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No articles found matching search criteria.</p>
        </div>
      )}
    </div>
  )
}
