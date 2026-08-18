"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import * as d3 from "d3"
import { Compass, Users, MapPin, Tag, FileText, ChevronRight, Sparkles, Loader2, Info } from "lucide-react"

interface Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: "character" | "location" | "topic"
  description?: string
  image?: string
}

interface Edge extends d3.SimulationLinkDatum<Node> {
  id: string
  source: string | Node
  target: string | Node
  articleIds: string[]
}

interface ContentItem {
  id: string
  title: string
  slug: string
  type: "article"
}

export default function LoreMapPage() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [contentMap, setContentMap] = useState<Map<string, ContentItem>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Interactive Selection State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)

  // Fetch Lore Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // 1. Fetch published characters
        const { data: chars } = await supabase
          .from("characters")
          .select("id, name, biography, featured_image")
          .eq("status", "published")

        // 2. Fetch lore topics
        const { data: topics } = await supabase
          .from("lore_topics")
          .select("id, name, type, description")

        // 3. Fetch precomputed co-occurrences connections
        const { data: conns } = await supabase
          .from("lore_connections")
          .select("id, source_id, target_id, article_ids")

        // 4. Fetch all published articles
        const { data: articles } = await supabase
          .from("articles")
          .select("id, title, slug")
          .eq("status", "published")

        // 5. Build lookup maps
        const tempContentMap = new Map<string, ContentItem>()
        articles?.forEach(a => tempContentMap.set(a.id, { id: a.id, title: a.title, slug: a.slug, type: "article" }))
        setContentMap(tempContentMap)

        // Compile Nodes
        const tempNodes: Node[] = []
        chars?.forEach(c => tempNodes.push({
          id: c.id,
          name: c.name,
          type: "character",
          description: c.biography ? c.biography.replace(/<[^>]+>/g, " ").substring(0, 160) + "..." : "GTA 6 Character",
          image: c.featured_image || undefined
        }))

        topics?.forEach(t => tempNodes.push({
          id: t.id,
          name: t.name,
          type: t.type,
          description: t.description || undefined
        }))

        // Compile Edges
        const tempEdges: Edge[] = []
        conns?.forEach(conn => {
          // Ensure both endpoints exist in our nodes list
          const sourceExists = tempNodes.some(n => n.id === conn.source_id)
          const targetExists = tempNodes.some(n => n.id === conn.target_id)
          if (sourceExists && targetExists) {
            tempEdges.push({
              id: conn.id,
              source: conn.source_id,
              target: conn.target_id,
              articleIds: conn.article_ids || []
            })
          }
        })

        setNodes(tempNodes)
        setEdges(tempEdges)
      } catch (err) {
        console.error("Failed loading lore map graph data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Draw D3 Graph
  useEffect(() => {
    if (isLoading || nodes.length === 0 || !svgRef.current) return

    const svgElement = d3.select(svgRef.current)
    svgElement.selectAll("*").remove() // clear previous drawing

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 600

    // Main graph group to support zooming
    const g = svgElement.append("g")

    // Zooming Setup
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svgElement.call(zoomBehavior)

    // Simulation Setup
    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Edge>(edges).id(d => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50))

    // Draw Links (Edges)
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", "rgba(255, 255, 255, 0.12)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", d => d.articleIds.length > 2 ? "0" : "4, 4")
      .style("transition", "stroke 0.2s ease")

    // Draw Nodes (Groups)
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, Node>("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d)
        // Center node zoom focus (optional zoom focus can be done here)
      })
      .on("mouseenter", (event, d) => {
        setHoveredNode(d)
      })
      .on("mouseleave", () => {
        setHoveredNode(null)
      })
      .call(
        d3.drag<SVGGElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Node outer circle (glow)
    node.append("circle")
      .attr("r", 20)
      .attr("fill", d => {
        if (d.type === "character") return "rgba(236, 72, 153, 0.2)" // Pink glow
        if (d.type === "location") return "rgba(16, 185, 129, 0.2)"  // Green glow
        return "rgba(168, 85, 247, 0.2)"                              // Purple glow
      })
      .attr("stroke", d => {
        if (d.type === "character") return "#ec4899"
        if (d.type === "location") return "#10b981"
        return "#a855f7"
      })
      .attr("stroke-width", 2)

    // Node Icons/Letters
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-weight", "black")
      .attr("font-family", "monospace")
      .text(d => d.name.charAt(0))

    // Node Labels (Text)
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 34)
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text(d => d.name)
      .clone(true).lower()
      .attr("fill", "none")
      .attr("stroke", "#070509")
      .attr("stroke-width", 3)

    // Update simulation positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x || 0)
        .attr("y1", d => (d.source as Node).y || 0)
        .attr("x2", d => (d.target as Node).x || 0)
        .attr("y2", d => (d.target as Node).y || 0)

      node.attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`)
    })

    // Cleanup simulation on unmount
    return () => {
      simulation.stop()
    }
  }, [isLoading, nodes, edges])

  // Interactive dynamic highlight style calculations
  useEffect(() => {
    if (isLoading || nodes.length === 0 || !svgRef.current) return

    const svgElement = d3.select(svgRef.current)
    const lines = svgElement.selectAll("line")
    const groups = svgElement.selectAll(".nodes g")

    const activeNode = hoveredNode || selectedNode

    if (activeNode) {
      // Find connected node IDs
      const connectedNodeIds = new Set<string>([activeNode.id])
      edges.forEach(edge => {
        const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source
        const targetId = typeof edge.target === "object" ? edge.target.id : edge.target

        if (sourceId === activeNode.id) {
          connectedNodeIds.add(targetId)
        } else if (targetId === activeNode.id) {
          connectedNodeIds.add(sourceId)
        }
      })

      // Highlight links
      lines.style("stroke", (d: any) => {
        const sourceId = typeof d.source === "object" ? d.source.id : d.source
        const targetId = typeof d.target === "object" ? d.target.id : d.target
        const isConnected = sourceId === activeNode.id || targetId === activeNode.id
        return isConnected ? "#ec4899" : "rgba(255, 255, 255, 0.05)"
      }).style("stroke-width", (d: any) => {
        const sourceId = typeof d.source === "object" ? d.source.id : d.source
        const targetId = typeof d.target === "object" ? d.target.id : d.target
        return (sourceId === activeNode.id || targetId === activeNode.id) ? "3px" : "2px"
      })

      // Dim non-connected nodes
      groups.style("opacity", d => connectedNodeIds.has((d as Node).id) ? 1 : 0.25)
    } else {
      // Reset default styling
      lines.style("stroke", "rgba(255, 255, 255, 0.12)").style("stroke-width", "2px")
      groups.style("opacity", 1)
    }
  }, [hoveredNode, selectedNode, isLoading, nodes, edges])

  // Compute connections and resources associated with the selected node
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null

    // Find all connections/edges for selected node
    const matchingEdges = edges.filter(edge => {
      const sId = typeof edge.source === "object" ? edge.source.id : edge.source
      const tId = typeof edge.target === "object" ? edge.target.id : edge.target
      return sId === selectedNode.id || tId === selectedNode.id
    })

    // Collect neighboring nodes & connecting articles
    const neighbors: Array<{ node: Node; articles: ContentItem[] }> = []

    matchingEdges.forEach(edge => {
      const sId = typeof edge.source === "object" ? edge.source.id : edge.source
      const tId = typeof edge.target === "object" ? edge.target.id : edge.target

      const neighborId = sId === selectedNode.id ? tId : sId
      const neighborNode = nodes.find(n => n.id === neighborId)

      if (neighborNode) {
        const items = edge.articleIds
          .map(id => contentMap.get(id))
          .filter(Boolean) as ContentItem[]

        neighbors.push({
          node: neighborNode,
          articles: items
        })
      }
    })

    return {
      node: selectedNode,
      neighbors
    }
  }, [selectedNode, nodes, edges, contentMap])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow flex flex-col space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-card-border pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <Compass className="w-5 h-5 text-neon-pink animate-pulse" />
            <span className="text-xs font-black tracking-widest text-neon-pink uppercase">
              VISUAL LORE EXPLORER
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Leonida Lore Connections Map
          </h1>
          <p className="text-xs sm:text-sm text-foreground/45">
            Interactive force-directed relationships graph charting co-occurrences of characters, locations, and key topics across all published media updates.
          </p>
        </div>

        <div className="bg-[#121016] border border-card-border px-4 py-3 rounded-lg text-xs flex items-center space-x-3 text-foreground/60 max-w-sm">
          <Info size={18} className="text-neon-pink shrink-0" />
          <span>
            <strong>Drag</strong> nodes to rearrange, <strong>Hover</strong> to preview links, and <strong>Click</strong> to unlock associated content articles!
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-grow py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-neon-pink animate-spin" />
          <p className="text-sm text-foreground/45 font-mono">Calibrating interactive lore forces...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-grow min-h-[500px]">
          {/* Left Column: Interactive D3 Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-[#0a080d] border border-card-border/80 rounded-2xl relative overflow-hidden flex flex-col min-h-[550px] shadow-2xl">
            {/* Ambient Background Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Canvas SVG */}
            <svg ref={svgRef} className="w-full h-full flex-grow relative z-10 min-h-[550px]" />

            {/* Interactive Color Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-20 bg-[#0c0a0e]/90 border border-card-border/60 p-4 rounded-xl flex flex-col gap-2.5 backdrop-blur shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 border-b border-card-border/40 pb-1.5">
                Legend
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-neon-pink border border-neon-pink/20" />
                <span className="text-white font-semibold">Characters</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#10b981] border border-emerald-500/20" />
                <span className="text-white font-semibold">Locations</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#a855f7] border border-purple-500/20" />
                <span className="text-white font-semibold">Topics</span>
              </div>
            </div>
          </div>

          {/* Right Column: Connection Directory / Info Side Panel (4 cols) */}
          <div className="lg:col-span-4 bg-[#0d0a0f] border border-card-border rounded-2xl p-6 flex flex-col justify-between shadow-xl min-h-[550px]">
            {selectedNodeDetails ? (
              <div className="space-y-6 flex-grow flex flex-col">
                {/* Node details */}
                <div className="space-y-3 pb-5 border-b border-card-border/60">
                  <div className="flex items-center space-x-2">
                    {selectedNodeDetails.node.type === "character" && <Users className="text-neon-pink w-5 h-5" />}
                    {selectedNodeDetails.node.type === "location" && <MapPin className="text-[#10b981] w-5 h-5" />}
                    {selectedNodeDetails.node.type === "topic" && <Tag className="text-[#a855f7] w-5 h-5" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      Selected {selectedNodeDetails.node.type}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                    {selectedNodeDetails.node.name}
                  </h2>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    {selectedNodeDetails.node.description || `A pivotal ${selectedNodeDetails.node.type} in the Leonida story-world.`}
                  </p>
                </div>

                {/* Neighbor directory */}
                <div className="space-y-4 flex-grow overflow-y-auto max-h-[300px] pr-1">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground/45 flex items-center space-x-1">
                    <Compass size={12} className="text-neon-pink" />
                    <span>Active Co-Occurrences ({selectedNodeDetails.neighbors.length})</span>
                  </h3>

                  {selectedNodeDetails.neighbors.length > 0 ? (
                    <div className="space-y-4">
                      {selectedNodeDetails.neighbors.map(({ node: n, articles }) => (
                        <div key={n.id} className="p-3.5 bg-[#121016]/80 border border-card-border/50 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase">{n.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              n.type === "character" ? "bg-neon-pink/15 text-neon-pink" : n.type === "location" ? "bg-emerald-500/15 text-emerald-400" : "bg-purple-500/15 text-purple-400"
                            }`}>
                              {n.type}
                            </span>
                          </div>

                          {/* Matching articles list */}
                          <div className="space-y-1.5 border-t border-card-border/40 pt-2.5">
                            <p className="text-[10px] font-extrabold text-foreground/40 uppercase tracking-wide">
                              Related Updates & Walkthroughs:
                            </p>
                            {articles.length > 0 ? (
                              <div className="space-y-1">
                                {articles.map(item => (
                                  <a
                                    key={item.id}
                                    href={`/news/${item.slug}`}
                                    className="flex items-center text-xs text-neon-pink hover:underline group py-0.5"
                                  >
                                    <FileText size={12} className="mr-1.5 shrink-0 opacity-60" />
                                    <span className="truncate pr-2 font-semibold text-white/95 group-hover:text-neon-pink transition">
                                      {item.title}
                                    </span>
                                    <ChevronRight size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-foreground/40 italic">Mentioned implicitly in database statistics.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/40 italic py-4">No active connections. This node is currently standalone.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-14 h-14 bg-neon-pink/5 rounded-full border border-neon-pink/15 flex items-center justify-center">
                  <Sparkles size={24} className="text-neon-pink/40 animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Inspect connections</h4>
                  <p className="text-xs text-foreground/40 leading-relaxed">
                    Click any node in the force graph map to focus on its connections and unlock matching news breakdowns.
                  </p>
                </div>
              </div>
            )}

            {/* Quick tips footer */}
            <div className="pt-4 border-t border-card-border/45 text-[10px] text-foreground/40 leading-normal flex items-center space-x-2">
              <Compass size={14} className="shrink-0 text-neon-pink opacity-50" />
              <span>Data automatically updates on publish cycles. Select any connection to jump right to the articles!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
