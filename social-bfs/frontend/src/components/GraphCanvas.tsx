/**
 * GraphCanvas.tsx — Visualização do grafo usando HTML5 Canvas API pura.
 *
 * Funcionalidades:
 * - Simulação force-directed do zero (repulsão Coulomb + atração spring + integração Euler)
 * - Renderização 2D via ctx.arc / ctx.lineTo / ctx.fillText
 * - Destaque visual do caminho BFS (nós e arestas em âmbar)
 * - Arrastar nós com mouse (mousedown / mousemove / mouseup)
 * - Zoom com scroll (wheel + ctx.scale)
 * - Tooltip nativo sobre o canvas
 */

import React, { useEffect, useRef, useCallback } from "react";
import { GraphNode, GraphEdge } from "../api";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightPath: number[];
  sourceId: number | null;
  targetId: number | null;
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#060d1a",
  edgeNormal: "rgba(51,65,85,0.55)",
  edgePath: "#f59e0b",
  nodeFill: "#1e293b",
  nodeStroke: "#38bdf8",
  nodeSource: "#22c55e",
  nodeTarget: "#ef4444",
  nodePath: "#f59e0b",
  labelNormal: "#94a3b8",
  labelPath: "#fbbf24",
  labelWhite: "#ffffff",
  tooltipBg: "rgba(15,23,42,0.96)",
  tooltipBorder: "#38bdf8",
};

// ── Tipos internos da simulação ───────────────────────────────────────────────
interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null; // posição fixada pelo drag
  fy: number | null;
}

export const GraphCanvas: React.FC<Props> = ({
  nodes,
  edges,
  highlightPath,
  sourceId,
  targetId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs para estado mutável que não precisa re-renderizar o componente
  const simNodesRef = useRef<SimNode[]>([]);
  const rafRef = useRef<number>(0);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ node: SimNode; startX: number; startY: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Sets derivados das props para uso dentro do loop de animação
  const pathSetRef = useRef<Set<number>>(new Set());
  const pathEdgeSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    pathSetRef.current = new Set(highlightPath);
    const pe = new Set<string>();
    for (let i = 0; i < highlightPath.length - 1; i++) {
      const a = highlightPath[i];
      const b = highlightPath[i + 1];
      pe.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    }
    pathEdgeSetRef.current = pe;
  }, [highlightPath]);

  // ── Funções de desenho ──────────────────────────────────────────────────────

  const nodeRadius = (n: SimNode): number => {
    if (n.id === sourceId || n.id === targetId) return 22;
    if (pathSetRef.current.has(n.id)) return 18;
    return 14;
  };

  const nodeColor = (n: SimNode): string => {
    if (n.id === sourceId) return C.nodeSource;
    if (n.id === targetId) return C.nodeTarget;
    if (pathSetRef.current.has(n.id)) return C.nodePath;
    return C.nodeFill;
  };

  const nodeStrokeColor = (n: SimNode): string => {
    if (n.id === sourceId) return "#86efac";
    if (n.id === targetId) return "#fca5a5";
    if (pathSetRef.current.has(n.id)) return C.nodePath;
    return C.nodeStroke;
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.restore();

    // Apply zoom + pan
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    const sNodes = simNodesRef.current;
    const pathSet = pathSetRef.current;
    const pathEdgeSet = pathEdgeSetRef.current;

    // Draw edges
    for (const edge of edges) {
      const src = sNodes.find((n) => n.id === edge.source);
      const tgt = sNodes.find((n) => n.id === edge.target);
      if (!src || !tgt) continue;

      const key = `${Math.min(edge.source, edge.target)}-${Math.max(edge.source, edge.target)}`;
      const isPath = pathEdgeSet.has(key);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isPath ? C.edgePath : C.edgeNormal;
      ctx.lineWidth = isPath ? 3 : 1.5;
      ctx.stroke();
    }

    // Draw nodes
    for (const n of sNodes) {
      const r = nodeRadius(n);
      const isHighlighted = pathSet.has(n.id) || n.id === sourceId || n.id === targetId;

      // Glow for highlighted nodes
      if (isHighlighted) {
        ctx.save();
        ctx.shadowColor = nodeColor(n);
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor(n);
        ctx.fill();
        ctx.restore();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor(n);
      ctx.fill();
      ctx.strokeStyle = nodeStrokeColor(n);
      ctx.lineWidth = isHighlighted ? 3 : 1.5;
      ctx.stroke();

      // ID label inside node
      ctx.fillStyle = (n.id === sourceId || n.id === targetId) ? C.labelWhite
        : pathSet.has(n.id) ? "#1a1a1a"
        : C.labelNormal;
      ctx.font = `bold ${pathSet.has(n.id) ? 11 : 9}px IBM Plex Mono, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n.id), n.x, n.y);

      // First-name label below node
      const labelY = n.y + r + 12;
      ctx.fillStyle = pathSet.has(n.id) ? C.labelPath : C.labelNormal;
      ctx.font = `${pathSet.has(n.id) ? "600 " : ""}9px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(n.name.split(" ")[0], n.x, labelY);
    }

    ctx.restore();
  }, [edges, sourceId, targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Simulação force-directed ────────────────────────────────────────────────

  const runSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const sNodes = simNodesRef.current;
    if (sNodes.length === 0) return;

    const REPULSION = 4000;
    const SPRING_LENGTH = 120;
    const SPRING_K = 0.04;
    const DAMPING = 0.82;
    const CENTER_K = 0.008;
    const cx = W / (2 * scaleRef.current) - offsetRef.current.x / scaleRef.current;
    const cy = H / (2 * scaleRef.current) - offsetRef.current.y / scaleRef.current;

    // Reset forces
    for (const n of sNodes) {
      n.vx = (n.vx || 0);
      n.vy = (n.vy || 0);
    }

    // Repulsion between every pair
    for (let i = 0; i < sNodes.length; i++) {
      for (let j = i + 1; j < sNodes.length; j++) {
        const a = sNodes[i];
        const b = sNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(dist2);
        const force = REPULSION / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (a.fx === null) { a.vx += fx; a.vy += fy; }
        if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
      }
    }

    // Spring attraction along edges
    const nodeById = new Map(sNodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      const a = nodeById.get(edge.source);
      const b = nodeById.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = SPRING_K * (dist - SPRING_LENGTH);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (a.fx === null) { a.vx += fx; a.vy += fy; }
      if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
    }

    // Weak centering force
    for (const n of sNodes) {
      if (n.fx === null) {
        n.vx += (cx - n.x) * CENTER_K;
        n.vy += (cy - n.y) * CENTER_K;
      }
    }

    // Euler integration
    for (const n of sNodes) {
      if (n.fx !== null) {
        n.x = n.fx;
        n.y = n.fy!;
      } else {
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    draw(ctx, W, H);
    rafRef.current = requestAnimationFrame(runSimulation);
  }, [edges, draw]);

  // ── Inicializar nós quando props mudam ────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    // Re-use existing positions when possible (avoids jarring resets)
    const existing = new Map(simNodesRef.current.map((n) => [n.id, n]));

    simNodesRef.current = nodes.map((n) => {
      const prev = existing.get(n.id);
      if (prev) return { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy, fx: null, fy: null };
      // Scatter randomly around center
      const angle = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * Math.min(W, H) * 0.25;
      return {
        ...n,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        fx: null,
        fy: null,
      };
    });

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(runSimulation);

    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, runSimulation]);

  // ── Resize observer ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  // ── Tooltip ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const div = document.createElement("div");
    Object.assign(div.style, {
      position: "fixed",
      background: C.tooltipBg,
      border: `1px solid ${C.tooltipBorder}`,
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "12px",
      color: "#e2e8f0",
      pointerEvents: "none",
      opacity: "0",
      zIndex: "9999",
      transition: "opacity 0.15s",
      maxWidth: "200px",
      fontFamily: "Inter, sans-serif",
      lineHeight: "1.5",
    });
    document.body.appendChild(div);
    tooltipRef.current = div;
    return () => div.remove();
  }, []);

  // ── Mouse events ─────────────────────────────────────────────────────────────

  const canvasToWorld = (cx: number, cy: number) => ({
    x: (cx - offsetRef.current.x) / scaleRef.current,
    y: (cy - offsetRef.current.y) / scaleRef.current,
  });

  const hitTest = useCallback((wx: number, wy: number): SimNode | null => {
    for (const n of simNodesRef.current) {
      const r = nodeRadius(n as SimNode);
      const dx = n.x - wx;
      const dy = n.y - wy;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hit = hitTest(x, y);
    if (hit) {
      hit.fx = hit.x;
      hit.fy = hit.y;
      dragRef.current = { node: hit, startX: x, startY: y };
    }
  }, [hitTest]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (dragRef.current) {
      dragRef.current.node.fx = x;
      dragRef.current.node.fy = y;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      return;
    }

    // Tooltip on hover
    const hit = hitTest(x, y);
    const tip = tooltipRef.current;
    if (tip) {
      if (hit) {
        tip.innerHTML = `<div style="font-weight:700;color:#38bdf8;margin-bottom:4px">${hit.name}</div>
          <div style="color:#94a3b8">@${hit.username}</div>
          <div style="margin-top:6px">🏙 ${hit.city}</div>
          <div>🏢 ${hit.company}</div>
          <div>🔗 Grau: ${hit.degree}</div>`;
        tip.style.opacity = "1";
        tip.style.left = e.clientX + 14 + "px";
        tip.style.top = e.clientY - 10 + "px";
      } else {
        tip.style.opacity = "0";
      }
    }
  }, [hitTest]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
      dragRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
  }, [handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, scaleRef.current * delta));

    // Zoom toward cursor
    offsetRef.current.x = mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current);
    offsetRef.current.y = my - (my - offsetRef.current.y) * (newScale / scaleRef.current);
    scaleRef.current = newScale;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: dragRef.current ? "grabbing" : "default" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
};
