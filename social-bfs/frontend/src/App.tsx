/**
 * App.tsx — Componente raiz da aplicação Social BFS
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  fetchUsers,
  fetchGraph,
  findShortestPath,
  User,
  GraphData,
  ShortestPathResult,
  FarthestUsersResult,
} from "./api";
import { GraphCanvas } from "./components/GraphCanvas";
import { PathResult } from "./components/PathResult";
import { StatsPanel } from "./components/StatsPanel";
import "./App.css";

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [pathResult, setPathResult] = useState<ShortestPathResult | null>(null);
  const [highlightPath, setHighlightPath] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersData, graph] = await Promise.all([fetchUsers(), fetchGraph()]);
        setUsers(usersData);
        setGraphData(graph);
        if (usersData.length >= 2) {
          setSourceId(usersData[0].id);
          setTargetId(usersData[usersData.length - 1].id);
        }
      } catch (err) {
        setGlobalError(
          "Não foi possível conectar ao backend. Certifique-se de que o servidor FastAPI está rodando em http://localhost:8000"
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = useCallback(async () => {
    if (sourceId === null || targetId === null) return;
    setIsSearching(true);
    setPathResult(null);
    setHighlightPath([]);
    try {
      const result = await findShortestPath(sourceId, targetId);
      setPathResult(result);
      if (result.exists) {
        setTimeout(() => setHighlightPath(result.path), 300);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Erro ao buscar caminho.";
      setPathResult({ exists: false, path: [], path_details: [], distance: -1, message: msg });
    } finally {
      setIsSearching(false);
    }
  }, [sourceId, targetId]);

  const handleFarthestFound = useCallback((result: FarthestUsersResult) => {
    setSourceId(result.user1.id);
    setTargetId(result.user2.id);
    setHighlightPath(result.path);
    setPathResult({
      exists: true,
      path: result.path,
      path_details: result.path_details,
      distance: result.distance,
      message: result.message,
    });
  }, []);

  if (isLoading) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="splash-icon-wrap">◈</div>
          <h1>Social BFS</h1>
          <p>Carregando rede social...</p>
          <div className="splash-bar"><div className="splash-progress" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">◈</span>
          <div>
            <h1 className="header-title">Social BFS</h1>
            <p className="header-sub">Busca em Largura em Redes Sociais</p>
          </div>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span>API Conectada</span>
        </div>
      </header>

      {globalError && <div className="global-error">{globalError}</div>}

      <main className="app-main">
        <aside className="sidebar">
          <section className="control-card">
            <h2 className="section-title">
              <span>🔍</span> Encontrar Caminho
            </h2>

            <div className="field-group">
              <label className="field-label">
                <span className="dot dot-green" /> Usuário Origem
              </label>
              <select
                className="select-input"
                value={sourceId ?? ""}
                onChange={(e) => { setSourceId(Number(e.target.value)); setPathResult(null); setHighlightPath([]); }}
              >
                <option value="" disabled>Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>#{u.id} — {u.name}</option>
                ))}
              </select>
            </div>

            <div className="swap-icon">↕</div>

            <div className="field-group">
              <label className="field-label">
                <span className="dot dot-red" /> Usuário Destino
              </label>
              <select
                className="select-input"
                value={targetId ?? ""}
                onChange={(e) => { setTargetId(Number(e.target.value)); setPathResult(null); setHighlightPath([]); }}
              >
                <option value="" disabled>Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>#{u.id} — {u.name}</option>
                ))}
              </select>
            </div>

            <button
              className="btn-search"
              onClick={handleSearch}
              disabled={isSearching || sourceId === null || targetId === null}
            >
              {isSearching ? "⟳  Executando BFS..." : "▶  Encontrar Caminho"}
            </button>
          </section>

          <PathResult result={pathResult} isLoading={isSearching} />
          <StatsPanel graphData={graphData} onFarthestFound={handleFarthestFound} />

          <section className="legend-card">
            <h3 className="legend-title">Legenda</h3>
            <div className="legend-list">
              <div className="legend-row"><span className="leg-dot" style={{background:"#22c55e"}} />Origem</div>
              <div className="legend-row"><span className="leg-dot" style={{background:"#ef4444"}} />Destino</div>
              <div className="legend-row"><span className="leg-dot" style={{background:"#f59e0b"}} />Caminho BFS</div>
              <div className="legend-row"><span className="leg-dot" style={{background:"#1e293b",border:"2px solid #38bdf8"}} />Outros nós</div>
            </div>
          </section>
        </aside>

        <section className="graph-section">
          <div className="graph-header">
            <h2 className="graph-title">Grafo da Rede Social</h2>
            <span className="graph-hint">Arraste os nós · Scroll para zoom · Hover para detalhes</span>
          </div>
          <div className="graph-container">
            {graphData && (
              <GraphCanvas
                nodes={graphData.nodes}
                edges={graphData.edges}
                highlightPath={highlightPath}
                sourceId={sourceId}
                targetId={targetId}
              />
            )}
          </div>
        </section>
      </main>

      <section className="explainer">
        <div className="explainer-inner">
          <h2 className="explainer-title">Como funciona?</h2>
          <div className="explainer-grid">
            <div className="ex-card">
              <div className="ex-icon">🕸️</div>
              <h3>Construção do Grafo</h3>
              <p>Usuários são <strong>vértices</strong>. Arestas são criadas por regras: mesma cidade, empresa, CEP, domínio de e-mail ou proximidade geográfica. Cada par com ao menos uma regra em comum recebe uma <strong>aresta</strong>.</p>
            </div>
            <div className="ex-card">
              <div className="ex-icon">🔎</div>
              <h3>Algoritmo BFS</h3>
              <p>O BFS explora o grafo <strong>nível por nível</strong> a partir da origem, usando uma <strong>fila FIFO</strong>. Garante sempre o caminho com o <strong>menor número de saltos</strong>. Complexidade: <code>O(V + E)</code>.</p>
            </div>
            <div className="ex-card">
              <div className="ex-icon">🔗</div>
              <h3>Frontend ↔ Backend</h3>
              <p>O React consome endpoints REST do <strong>FastAPI</strong> via axios. O frontend envia <code>source_id</code> e <code>target_id</code>, o backend executa BFS em Python e retorna o caminho como JSON, destacado no grafo <strong>D3.js</strong>.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        Social BFS · Projeto Acadêmico · Algoritmos em Grafos · FastAPI + React + D3.js
      </footer>
    </div>
  );
};

export default App;
