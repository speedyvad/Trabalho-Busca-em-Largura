/**
 * GraphCanvas.tsx — Visualização do grafo usando D3.js
 *
 * Funcionalidades:
 * - Renderiza nós (usuários) e arestas (conexões) com força física (force simulation)
 * - Destaca visualmente o caminho BFS encontrado (nós e arestas em cor especial)
 * - Animação de entrada dos nós
 * - Tooltip com info do usuário ao passar o mouse
 * - Zoom e pan nativos via D3
 */

import React, { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { GraphNode, GraphEdge } from "../api";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightPath: number[]; // IDs dos nós no caminho BFS
  sourceId: number | null;
  targetId: number | null;
}

// Paleta de cores
const COLOR = {
  nodeFill: "#1e293b",
  nodeStroke: "#38bdf8",
  nodeHighlight: "#f59e0b",
  nodeSource: "#22c55e",
  nodeTarget: "#ef4444",
  edgeNormal: "#334155",
  edgePath: "#f59e0b",
  label: "#94a3b8",
  labelHighlight: "#fff",
};

export const GraphCanvas: React.FC<Props> = ({
  nodes,
  edges,
  highlightPath,
  sourceId,
  targetId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  const pathSet = new Set(highlightPath);
  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < highlightPath.length - 1; i++) {
    const a = highlightPath[i];
    const b = highlightPath[i + 1];
    pathEdgeSet.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
  }

  const draw = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const container = svgRef.current.parentElement!;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 550;

    // Limpar SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", W)
      .attr("height", H);

    // Grupo principal com zoom
    const g = svg.append("g");
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    // Definição de marcadores de seta (para arestas normais e de caminho)
    const defs = svg.append("defs");
    ["normal", "path"].forEach((type) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", type === "path" ? COLOR.edgePath : COLOR.edgeNormal);
    });

    // Preparar dados para simulação
    const nodeMap = new Map(nodes.map((n) => [n.id, { ...n, x: W / 2, y: H / 2 }]));
    const simNodes = Array.from(nodeMap.values());
    const simEdges = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        isPath: pathEdgeSet.has(`${Math.min(e.source, e.target)}-${Math.max(e.source, e.target)}`),
      }));

    // Simulação de física
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink(simEdges)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(32));

    simulationRef.current = simulation;

    // Arestas
    const link = g
      .append("g")
      .selectAll("line")
      .data(simEdges)
      .enter()
      .append("line")
      .attr("stroke", (d) => (d.isPath ? COLOR.edgePath : COLOR.edgeNormal))
      .attr("stroke-width", (d) => (d.isPath ? 3 : 1.5))
      .attr("stroke-opacity", (d) => (d.isPath ? 1 : 0.4))
      .attr("stroke-dasharray", (d) => (d.isPath ? "none" : "none"));

    // Grupos de nós
    const node = g
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Glow filter para nós destacados
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Círculo do nó
    node
      .append("circle")
      .attr("r", (d: any) => {
        if (d.id === sourceId || d.id === targetId) return 22;
        if (pathSet.has(d.id)) return 18;
        return 14;
      })
      .attr("fill", (d: any) => {
        if (d.id === sourceId) return COLOR.nodeSource;
        if (d.id === targetId) return COLOR.nodeTarget;
        if (pathSet.has(d.id)) return COLOR.nodeHighlight;
        return COLOR.nodeFill;
      })
      .attr("stroke", (d: any) => {
        if (d.id === sourceId) return "#86efac";
        if (d.id === targetId) return "#fca5a5";
        if (pathSet.has(d.id)) return COLOR.nodeHighlight;
        return COLOR.nodeStroke;
      })
      .attr("stroke-width", (d: any) =>
        pathSet.has(d.id) || d.id === sourceId || d.id === targetId ? 3 : 1.5
      )
      .attr("filter", (d: any) =>
        pathSet.has(d.id) ? "url(#glow)" : "none"
      )
      .attr("opacity", 0)
      .transition()
      .duration(600)
      .delay((_, i) => i * 50)
      .attr("opacity", 1);

    // Ícone inicial do nó (letra)
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", (d: any) => (pathSet.has(d.id) ? 11 : 9))
      .attr("font-weight", "bold")
      .attr("fill", (d: any) => {
        if (d.id === sourceId || d.id === targetId) return "#fff";
        if (pathSet.has(d.id)) return "#1a1a1a";
        return COLOR.label;
      })
      .text((d: any) => d.id)
      .attr("pointer-events", "none");

    // Label com nome abaixo do nó
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => {
        if (d.id === sourceId || d.id === targetId) return 30;
        if (pathSet.has(d.id)) return 26;
        return 22;
      })
      .attr("font-size", 9)
      .attr("fill", (d: any) => (pathSet.has(d.id) ? "#fbbf24" : COLOR.label))
      .attr("font-weight", (d: any) => (pathSet.has(d.id) ? "600" : "normal"))
      .text((d: any) => d.name.split(" ")[0])
      .attr("pointer-events", "none");

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "fixed")
      .style("background", "rgba(15,23,42,0.95)")
      .style("border", "1px solid #38bdf8")
      .style("border-radius", "8px")
      .style("padding", "10px 14px")
      .style("font-size", "12px")
      .style("color", "#e2e8f0")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")
      .style("transition", "opacity 0.2s")
      .style("max-width", "200px");

    node
      .on("mouseover", (event, d: any) => {
        tooltip
          .html(
            `<div style="font-weight:700;color:#38bdf8;margin-bottom:4px">${d.name}</div>
             <div style="color:#94a3b8">@${d.username}</div>
             <div style="margin-top:6px">🏙 ${d.city}</div>
             <div>🏢 ${d.company}</div>
             <div>🔗 Grau: ${d.degree}</div>`
          )
          .style("opacity", "1")
          .style("left", event.clientX + 14 + "px")
          .style("top", event.clientY - 10 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.clientX + 14 + "px")
          .style("top", event.clientY - 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", "0");
      });

    // Atualizar posições a cada tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      tooltip.remove();
      simulation.stop();
    };
  }, [nodes, edges, highlightPath, sourceId, targetId]);

  useEffect(() => {
    const cleanup = draw();
    return () => {
      cleanup?.();
      simulationRef.current?.stop();
    };
  }, [draw]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
};
