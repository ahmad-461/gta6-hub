"use client"

import React, { useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import NextImage from "next/image"
import Youtube from "@tiptap/extension-youtube"
import { Mark, mergeAttributes } from "@tiptap/core"
import { supabase } from "@/lib/supabase"
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Minus,
  EyeOff,
  Undo,
  Redo,
  X,
  Search,
  Loader2,
  CheckCircle2
} from "lucide-react"

// Define custom Spoiler Tiptap Mark
const Spoiler = Mark.create({
  name: "spoiler",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "bg-foreground text-foreground cursor-pointer select-none px-1 rounded transition-colors duration-200 hover:bg-foreground/80 [mask-image:none] [&.is-revealed]:bg-[#2a2735] [&.is-revealed]:text-[#f3f4f6]",
        onclick: "this.classList.toggle('is-revealed')",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[data-spoiler]",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-spoiler": "" }, this.options.HTMLAttributes, HTMLAttributes), 0]
  },
})

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [mediaSearch, setMediaSearch] = useState("")
  const [externalImageUrl, setExternalImageUrl] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-neon-blue hover:underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg my-4 border border-card-border",
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: "aspect-video w-full max-w-2xl rounded-lg my-4 border border-card-border mx-auto",
        },
      }),
      Spoiler,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4 text-white bg-[#100e16] border border-card-border rounded-b-lg text-sm leading-relaxed",
      },
    },
  })

  // Sync content if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const fetchMedia = async () => {
    setIsLoadingMedia(true)
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("uploaded_at", { ascending: false })

      if (!error) {
        setMediaList(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingMedia(false)
    }
  }

  const handleOpenMediaModal = () => {
    setIsMediaModalOpen(true)
    fetchMedia()
  }

  const handleInsertImage = (url: string, alt: string) => {
    editor?.chain().focus().setImage({ src: url, alt: alt }).run()
    setIsMediaModalOpen(false)
    setExternalImageUrl("")
  }

  const handleInsertYoutube = () => {
    if (!youtubeUrl) return
    editor?.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run()
    setIsYoutubeModalOpen(false)
    setYoutubeUrl("")
  }

  const handleToggleLink = () => {
    const previousUrl = editor?.getAttributes("link").href
    const url = window.prompt("Enter URL:", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  if (!editor) {
    return null
  }

  const filteredMedia = mediaList.filter((item) =>
    (item.filename || "").toLowerCase().includes(mediaSearch.toLowerCase()) ||
    (item.alt_text || "").toLowerCase().includes(mediaSearch.toLowerCase())
  )

  return (
    <div className="relative border border-card-border rounded-lg bg-[#15131a]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#1b1923] border-b border-card-border rounded-t-lg">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("bold") ? "bg-neon-pink/10 text-neon-pink" : ""
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("italic") ? "bg-neon-pink/10 text-neon-pink" : ""
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("heading", { level: 2 }) ? "bg-neon-blue/10 text-neon-blue" : ""
          }`}
          title="Heading H2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("heading", { level: 3 }) ? "bg-neon-blue/10 text-neon-blue" : ""
          }`}
          title="Heading H3"
        >
          <Heading3 size={16} />
        </button>
        <div className="w-px h-6 bg-card-border mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("bulletList") ? "bg-neon-purple/10 text-neon-purple" : ""
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("orderedList") ? "bg-neon-purple/10 text-neon-purple" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("blockquote") ? "bg-neon-yellow/10 text-neon-yellow" : ""
          }`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={handleToggleLink}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("link") ? "bg-neon-blue/10 text-neon-blue" : ""
          }`}
          title="Link"
        >
          <LinkIcon size={16} />
        </button>
        <div className="w-px h-6 bg-card-border mx-1"></div>
        <button
          type="button"
          onClick={handleOpenMediaModal}
          className="p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white"
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => setIsYoutubeModalOpen(true)}
          className="p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white"
          title="Embed YouTube Video"
        >
          <YoutubeIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white"
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleMark("spoiler").run()}
          className={`p-2 rounded hover:bg-card-border transition text-foreground/80 hover:text-white ${
            editor.isActive("spoiler") ? "bg-neon-pink/20 text-neon-pink font-bold" : ""
          }`}
          title="Spoiler Text (Reveal on Click)"
        >
          <EyeOff size={16} />
        </button>
        <div className="w-px h-6 bg-card-border mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-card-border transition text-foreground/40 hover:text-white disabled:opacity-40"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-card-border transition text-foreground/40 hover:text-white disabled:opacity-40"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Content Area */}
      <EditorContent editor={editor} />

      {/* Media Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Image from Media Library</h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="text-foreground/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="p-4 bg-[#100e16] border-b border-card-border space-y-4">
              <div className="relative">
                <Search className="absolute inset-y-0 left-3 flex items-center text-foreground/40 mt-2" size={16} />
                <input
                  type="text"
                  placeholder="Search media library..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 bg-[#1a1822] border border-card-border rounded text-sm text-white placeholder-foreground/40 focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>

              {/* Paste URL Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Or paste external image URL..."
                  value={externalImageUrl}
                  onChange={(e) => setExternalImageUrl(e.target.value)}
                  className="flex-grow px-3 py-1.5 bg-[#1a1822] border border-card-border rounded text-sm text-white placeholder-foreground/40 focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
                <button
                  type="button"
                  onClick={() => handleInsertImage(externalImageUrl, "External featured image")}
                  disabled={!externalImageUrl}
                  className="px-4 py-1.5 bg-neon-blue hover:bg-neon-blue/90 text-black font-bold text-xs rounded transition uppercase disabled:opacity-50"
                >
                  Insert URL
                </button>
              </div>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#110f17]/50">
              {isLoadingMedia ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
                </div>
              ) : filteredMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleInsertImage(item.url, item.alt_text || item.filename)}
                      className="group border border-card-border hover:border-neon-blue bg-card-bg rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-card-border overflow-hidden">
                        <NextImage
                          src={item.url}
                          alt={item.alt_text || "Tiptap image option"}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-contain group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-white font-semibold truncate" title={item.filename}>
                          {item.filename}
                        </p>
                        <p className="text-[10px] text-foreground/40 mt-0.5 truncate">{item.alt_text}</p>
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

      {/* YouTube Modal */}
      {isYoutubeModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Embed YouTube Video</h3>
              <button
                type="button"
                onClick={() => setIsYoutubeModalOpen(false)}
                className="text-foreground/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-1.5">
                  YouTube Video URL or ID
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1822] border border-card-border rounded text-sm text-white placeholder-foreground/40 focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsYoutubeModalOpen(false)}
                  className="px-4 py-2 bg-[#1a1822] hover:bg-card-border/50 text-white text-xs font-semibold rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertYoutube}
                  disabled={!youtubeUrl}
                  className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/90 text-black text-xs font-bold rounded transition uppercase tracking-wider disabled:opacity-50"
                >
                  Insert Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
