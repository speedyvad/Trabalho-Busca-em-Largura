/**
 * GraphCanvas.tsx — Mapa de contatos do escritório via Canvas API pura.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { GraphNode, GraphEdge } from "../api";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  exposureMap: Record<number, number>;
  sourceId: number | null;
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const EXPOSURE_FILL   = ["#ff3d57", "#ff8142", "#ffc04a", "#ffd166", "#ffe59a"];
const EXPOSURE_STROKE = ["#ff8a9a", "#ffb888", "#ffe090", "#ffeeaa", "#fff5cc"];
const NODE_FILL_SAFE   = "#0c2138";
const NODE_STROKE_SAFE = "#00c4a7";
const EDGE_EXPOSED     = "rgba(255,129,66,0.65)";
const EDGE_NORMAL      = "rgba(20,60,100,0.50)";

// ── Salas do escritório ───────────────────────────────────────────────────────
interface RoomDef { rx: number; ry: number; rw: number; rh: number; label: string; icon: string; }

const ROOM_DEFS: Record<string, RoomDef> = {
  "Recepção":   { rx: 0.02, ry: 0.03, rw: 0.13, rh: 0.35, label: "Recepção",   icon: "🚪" },
  "TI":         { rx: 0.19, ry: 0.03, rw: 0.22, rh: 0.35, label: "TI / Dev",   icon: "🖥" },
  "Financeiro": { rx: 0.46, ry: 0.03, rw: 0.21, rh: 0.35, label: "Financeiro", icon: "📊" },
  "Diretoria":  { rx: 0.02, ry: 0.44, rw: 0.15, rh: 0.35, label: "Diretoria",  icon: "🏛" },
  "RH":         { rx: 0.21, ry: 0.44, rw: 0.21, rh: 0.35, label: "RH",         icon: "👥" },
  "Comercial":  { rx: 0.46, ry: 0.44, rw: 0.27, rh: 0.35, label: "Comercial",  icon: "💼" },
  "Jurídico":   { rx: 0.02, ry: 0.85, rw: 0.23, rh: 0.13, label: "Jurídico",   icon: "⚖" },
  "Operações":  { rx: 0.31, ry: 0.85, rw: 0.26, rh: 0.13, label: "Operações",  icon: "⚙" },
};

interface SimNode extends GraphNode {
  x: number; y: number; vx: number; vy: number;
  fx: number | null; fy: number | null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w,     y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r,     y + h);
  ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
  ctx.lineTo(x,         y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}

// ── Componente ────────────────────────────────────────────────────────────────
export const GraphCanvas: React.FC<Props> = ({ nodes, edges, exposureMap, sourceId }) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const rafRef      = useRef<number>(0);
  const scaleRef    = useRef(1);
  const offsetRef   = useRef({ x: 0, y: 0 });
  const dragRef     = useRef<{ node: SimNode } | null>(null);
  const tooltipRef  = useRef<HTMLDivElement | null>(null);
  const exposureRef = useRef(exposureMap);
  const sourceRef   = useRef(sourceId);

  // ── Dimensões estáveis — evita loop do ResizeObserver ─────────────────────
  const wRef = useRef(800);
  const hRef = useRef(550);

  useEffect(() => { exposureRef.current = exposureMap; }, [exposureMap]);
  useEffect(() => { sourceRef.current   = sourceId;    }, [sourceId]);

  // ── Helpers de nó ──────────────────────────────────────────────────────────
  const nodeFill   = (n: SimNode) => { const d = exposureRef.current[n.id]; return d === undefined ? NODE_FILL_SAFE   : EXPOSURE_FILL[Math.min(d, 4)]; };
  const nodeStroke = (n: SimNode) => { const d = exposureRef.current[n.id]; return d === undefined ? NODE_STROKE_SAFE : EXPOSURE_STROKE[Math.min(d, 4)]; };
  const nodeR      = (n: SimNode) => n.id === sourceRef.current ? 20 : exposureRef.current[n.id] !== undefined ? 17 : 13;
  const isExposed  = (n: SimNode) => exposureRef.current[n.id] !== undefined;

  // ── Desenho ────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    const sNodes = simNodesRef.current;
    const expo   = exposureRef.current;

    const contamRooms = new Set<string>();
    for (const n of sNodes) if (expo[n.id] !== undefined) contamRooms.add(n.city);

    // 1. Salas
    for (const [roomName, rd] of Object.entries(ROOM_DEFS)) {
      if (!sNodes.some((n) => n.city === roomName)) continue;
      const x = rd.rx * W, y = rd.ry * H, w = rd.rw * W, h = rd.rh * H;
      const hot = contamRooms.has(roomName);

      roundRect(ctx, x, y, w, h, 8);
      ctx.fillStyle   = hot ? "rgba(255,61,87,0.10)" : "rgba(10,40,70,0.70)";
      ctx.fill();
      ctx.strokeStyle = hot ? "rgba(255,100,80,0.70)" : "rgba(0,150,120,0.40)";
      ctx.lineWidth   = hot ? 1.5 : 1;
      ctx.stroke();

      ctx.font         = "600 11px Inter, sans-serif";
      ctx.fillStyle    = hot ? "rgba(255,150,100,0.90)" : "rgba(0,196,167,0.75)";
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${rd.icon} ${rd.label}`, x + 8, y + 7);
    }

    // 2. Arestas
    const byId = new Map(sNodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      const s = byId.get(edge.source), t = byId.get(edge.target);
      if (!s || !t) continue;
      const both = expo[s.id] !== undefined && expo[t.id] !== undefined;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = both ? EDGE_EXPOSED : EDGE_NORMAL;
      ctx.lineWidth   = both ? 2 : 1.2;
      ctx.stroke();
    }

    // 3. Nós
    for (const n of sNodes) {
      const r    = nodeR(n);
      const fill = nodeFill(n);
      const strk = nodeStroke(n);
      const exp  = isExposed(n);

      if (exp) {
        ctx.save();
        ctx.shadowColor = fill;
        ctx.shadowBlur  = n.id === sourceRef.current ? 24 : 14;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill; ctx.fill();
        ctx.restore();
      }

      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle   = fill; ctx.fill();
      ctx.strokeStyle = strk; ctx.lineWidth = exp ? 2.5 : 1.5; ctx.stroke();

      ctx.fillStyle    = exp ? "#fff" : "rgba(91,154,181,0.80)";
      ctx.font         = `bold ${exp ? 10 : 8}px IBM Plex Mono, monospace`;
      ctx.textAlign    = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(n.id), n.x, n.y);

      ctx.fillStyle    = exp ? fill : "rgba(43,95,120,0.85)";
      ctx.font         = `${exp ? "600 " : ""}9px Inter, sans-serif`;
      ctx.textAlign    = "center"; ctx.textBaseline = "top";
      ctx.fillText(n.name.split(" ")[0], n.x, n.y + r + 4);
    }

    ctx.restore();
  }, [edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Simulação ───────────────────────────────────────────────────────────────
  const runSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = wRef.current;
    const H = hRef.current;
    const sNodes = simNodesRef.current;
    if (!sNodes.length) return;

    const REPULSION  = 2000;
    const SPRING_K   = 0.030;
    const SPRING_LEN = 80;
    const CLUSTER_K  = 0.050;
    const WALL_K     = 0.10;
    const WALL_PAD   = 20;
    const DAMPING    = 0.78;

    for (let i = 0; i < sNodes.length; i++) {
      for (let j = i + 1; j < sNodes.length; j++) {
        const a = sNodes[i], b = sNodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy || 1;
        const d  = Math.sqrt(d2);
        const f  = REPULSION / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        if (a.fx === null) { a.vx += fx; a.vy += fy; }
        if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
      }
    }

    const byId = new Map(sNodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      const a = byId.get(edge.source), b = byId.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      const f  = SPRING_K * (d - SPRING_LEN);
      const fx = (dx / d) * f, fy = (dy / d) * f;
      if (a.fx === null) { a.vx += fx; a.vy += fy; }
      if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
    }

    for (const n of sNodes) {
      if (n.fx !== null) continue;
      const rd = ROOM_DEFS[n.city];
      if (!rd) continue;
      const cx = (rd.rx + rd.rw / 2) * W;
      const cy = (rd.ry + rd.rh / 2) * H;
      n.vx += (cx - n.x) * CLUSTER_K;
      n.vy += (cy - n.y) * CLUSTER_K;

      const left  = rd.rx * W + WALL_PAD;
      const right = (rd.rx + rd.rw) * W - WALL_PAD;
      const top   = rd.ry * H + WALL_PAD + 18;
      const bot   = (rd.ry + rd.rh) * H - WALL_PAD;
      if (n.x < left)  n.vx += (left  - n.x) * WALL_K;
      if (n.x > right) n.vx += (right - n.x) * WALL_K;
      if (n.y < top)   n.vy += (top   - n.y) * WALL_K;
      if (n.y > bot)   n.vy += (bot   - n.y) * WALL_K;
    }

    for (const n of sNodes) {
      if (n.fx !== null) { n.x = n.fx; n.y = n.fy!; }
      else { n.vx *= DAMPING; n.vy *= DAMPING; n.x += n.vx; n.y += n.vy; }
    }

    draw(ctx, W, H);
    rafRef.current = requestAnimationFrame(runSimulation);
  }, [edges, draw]);

  // ── Resize — com guarda contra loop ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const applySize = (W: number, H: number) => {
      if (!W || !H) return;
      if (W === wRef.current && H === hRef.current) return; // evita loop
      wRef.current  = W;
      hRef.current  = H;
      canvas.width  = W;
      canvas.height = H;
    };

    // Tamanho inicial
    const p = canvas.parentElement;
    if (p) applySize(p.clientWidth, p.clientHeight);

    const ro = new ResizeObserver((entries) => {
      // requestAnimationFrame breaks the synchronous loop:
      // sidebar growing after spread result renders causes layout reflow
      // → canvas shrinks → ResizeObserver fires → canvas.width set → reflow → loop
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          applySize(Math.round(width), Math.round(height));
        }
      });
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // ── Inicializar nós nas posições das salas ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = () => {
      const W = wRef.current;
      const H = hRef.current;
      const existing = new Map(simNodesRef.current.map((n) => [n.id, n]));

      simNodesRef.current = nodes.map((n) => {
        const prev = existing.get(n.id);
        if (prev) return { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy, fx: null, fy: null };

        const rd = ROOM_DEFS[n.city];
        const cx = rd ? (rd.rx + rd.rw / 2) * W : W / 2;
        const cy = rd ? (rd.ry + rd.rh / 2) * H : H / 2;
        return { ...n, x: cx + (Math.random() - 0.5) * 30, y: cy + (Math.random() - 0.5) * 22, vx: 0, vy: 0, fx: null, fy: null };
      });

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(runSimulation);
    };

    // Garante que o canvas já foi dimensionado antes de inicializar
    if (wRef.current > 0 && hRef.current > 0) {
      init();
    } else {
      // Aguarda um frame para o ResizeObserver disparar
      const id = requestAnimationFrame(init);
      return () => { cancelAnimationFrame(id); cancelAnimationFrame(rafRef.current); };
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, runSimulation]);

  // ── Tooltip ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const div = document.createElement("div");
    Object.assign(div.style, {
      position: "fixed", background: "rgba(7,18,33,0.97)",
      border: "1px solid #00c4a7", borderRadius: "8px",
      padding: "10px 14px", fontSize: "12px", color: "#ddf0f8",
      pointerEvents: "none", opacity: "0", zIndex: "9999",
      transition: "opacity 0.15s", maxWidth: "210px",
      fontFamily: "Inter, sans-serif", lineHeight: "1.55",
    });
    document.body.appendChild(div);
    tooltipRef.current = div;
    return () => div.remove();
  }, []);

  const toWorld = (cx: number, cy: number) => ({
    x: (cx - offsetRef.current.x) / scaleRef.current,
    y: (cy - offsetRef.current.y) / scaleRef.current,
  });

  const hitTest = useCallback((wx: number, wy: number): SimNode | null => {
    for (const n of simNodesRef.current) {
      const r = nodeR(n as SimNode);
      const dx = n.x - wx, dy = n.y - wy;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hit = hitTest(x, y);
    if (hit) { hit.fx = hit.x; hit.fy = hit.y; dragRef.current = { node: hit }; }
  }, [hitTest]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (dragRef.current) {
      dragRef.current.node.fx = x;
      dragRef.current.node.fy = y;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      return;
    }

    const tip = tooltipRef.current;
    const hit = hitTest(x, y);
    if (tip) {
      if (hit) {
        const dist = exposureRef.current[hit.id];
        const distLabel =
          dist === 0 ? '<span style="color:#ff3d57;font-weight:700">Paciente Zero</span>' :
          dist === 1 ? '<span style="color:#ff8142">1º grau</span>' :
          dist === 2 ? '<span style="color:#ffc04a">2º grau</span>' :
          dist !== undefined ? `<span style="color:#ffd166">${dist}º grau</span>` :
          '<span style="color:#00c4a7">Sem exposição</span>';
        tip.innerHTML = `
          <div style="font-weight:700;color:#00c4a7;margin-bottom:4px">${hit.name}</div>
          <div style="color:#5b9ab5">@${hit.username}</div>
          <div style="margin-top:6px">🏢 ${hit.city}</div>
          <div>💼 ${hit.company}</div>
          <div>🔗 Grau de contato: ${hit.degree}</div>
          <div style="margin-top:4px">${distLabel}</div>`;
        tip.style.opacity = "1";
        tip.style.left = e.clientX + 14 + "px";
        tip.style.top  = e.clientY - 10 + "px";
      } else {
        tip.style.opacity = "0";
      }
    }
  }, [hitTest]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) { dragRef.current.node.fx = null; dragRef.current.node.fy = null; dragRef.current = null; }
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
  }, [handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const mx    = e.clientX - rect.left;
    const my    = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newS  = Math.max(0.25, Math.min(3.5, scaleRef.current * delta));
    offsetRef.current.x = mx - (mx - offsetRef.current.x) * (newS / scaleRef.current);
    offsetRef.current.y = my - (my - offsetRef.current.y) * (newS / scaleRef.current);
    scaleRef.current = newS;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
};
