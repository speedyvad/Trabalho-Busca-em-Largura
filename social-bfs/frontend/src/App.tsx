/**
 * App.tsx — Outbreak Tracker
 * Seleção de Paciente Zero e visualização de contágio por BFS.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  fetchUsers,
  fetchGraph,
  findSpread,
  findFarthestUsers,
  User,
  GraphData,
  SpreadResult,
  FarthestUsersResult,
} from "./api";
import { GraphCanvas } from "./components/GraphCanvas";
import { SpreadResultPanel } from "./components/PathResult";
import { StatsPanel } from "./components/StatsPanel";
import "./App.css";

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [spreadResult, setSpreadResult] = useState<SpreadResult | null>(null);
  const [exposureMap, setExposureMap] = useState<Record<number, number>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [userLimit, setUserLimit] = useState(25);

  const loadData = useCallback(async (limit: number) => {
    try {
      const [usersData, graph] = await Promise.all([
        fetchUsers(limit),
        fetchGraph(limit),
      ]);
      setUsers(usersData);
      setGraphData(graph);
      setSourceId((prev) => {
        const valid = usersData.find((u) => u.id === prev);
        return valid ? prev : (usersData[0]?.id ?? null);
      });
      setSpreadResult(null);
      setExposureMap({});
    } catch {
      setGlobalError(
        "Não foi possível conectar ao backend. Certifique-se de que o servidor FastAPI está rodando em http://localhost:8000"
      );
    }
  }, []);

  useEffect(() => {
    loadData(25).then(() => setIsLoading(false));
  }, [loadData]);

  const handleLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setUserLimit(val);
      loadData(val);
    },
    [loadData]
  );

  const runSpread = useCallback(
    async (id: number, limit: number) => {
      setIsSearching(true);
      setSpreadResult(null);
      setExposureMap({});
      try {
        const result = await findSpread(id, limit);
        setSpreadResult(result);
        const map: Record<number, number> = { [id]: 0 };
        result.exposed.forEach((e) => { map[e.id] = e.distance; });
        setExposureMap(map);
      } catch (err: any) {
        const msg = err?.response?.data?.detail || "Erro ao rastrear contágio.";
        setGlobalError(msg);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearch = useCallback(() => {
    if (sourceId === null) return;
    runSpread(sourceId, userLimit);
  }, [sourceId, userLimit, runSpread]);

  const handleFarthestFound = useCallback(
    async (result: FarthestUsersResult) => {
      setSourceId(result.user1.id);
      runSpread(result.user1.id, userLimit);
    },
    [userLimit, runSpread]
  );

  if (isLoading) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="splash-icon-wrap">⚕</div>
          <h1>Outbreak Tracker</h1>
          <p>Inicializando sistema de monitoramento...</p>
          <div className="splash-bar"><div className="splash-progress" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">⚕</span>
          <div>
            <h1 className="header-title">Outbreak Tracker</h1>
            <p className="header-sub">Sistema de Rastreamento de Contágio Corporativo</p>
          </div>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span>Monitoramento Ativo</span>
        </div>
      </header>

      {globalError && (
        <div className="global-error" onClick={() => setGlobalError(null)}>
          {globalError}
        </div>
      )}

      <main className="app-main">
        <aside className="sidebar">
          {/* Slider de colaboradores */}
          <section className="control-card">
            <h2 className="section-title"><span>⚙</span> Configuração</h2>
            <div className="field-group">
              <label className="field-label">Colaboradores monitorados</label>
              <div className="slider-row">
                <input
                  type="range"
                  className="slider-input"
                  min={3}
                  max={25}
                  value={userLimit}
                  onChange={handleLimitChange}
                />
                <span className="slider-value">{userLimit} pessoas</span>
              </div>
            </div>
          </section>

          {/* Seleção de Paciente Zero */}
          <section className="control-card">
            <h2 className="section-title"><span>🦠</span> Rastrear Contágio</h2>
            <div className="field-group">
              <label className="field-label">
                <span className="dot dot-red" /> Paciente Zero
              </label>
              <select
                className="select-input"
                value={sourceId ?? ""}
                onChange={(e) => {
                  setSourceId(Number(e.target.value));
                  setSpreadResult(null);
                  setExposureMap({});
                }}
              >
                <option value="" disabled>Selecione o colaborador...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} — {u.name} ({u.city})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn-search"
              onClick={handleSearch}
              disabled={isSearching || sourceId === null}
            >
              {isSearching ? "⟳  Rastreando contágio..." : "🦠  Rastrear Contágio"}
            </button>
          </section>

          <SpreadResultPanel result={spreadResult} isLoading={isSearching} />

          <StatsPanel
            graphData={graphData}
            userLimit={userLimit}
            onFarthestFound={handleFarthestFound}
          />

          <section className="legend-card">
            <h3 className="legend-title">Legenda de Exposição</h3>
            <div className="legend-list">
              <div className="legend-row">
                <span className="leg-dot" style={{ background: "#ff3d57", boxShadow: "0 0 6px #ff3d57" }} />
                Paciente Zero
              </div>
              <div className="legend-row">
                <span className="leg-dot" style={{ background: "#ff8142" }} />
                1º Grau — contato direto
              </div>
              <div className="legend-row">
                <span className="leg-dot" style={{ background: "#ffc04a" }} />
                2º Grau — contato indireto
              </div>
              <div className="legend-row">
                <span className="leg-dot" style={{ background: "#ffd166" }} />
                3º Grau+
              </div>
              <div className="legend-row">
                <span className="leg-dot" style={{ background: "#0d2140", border: "2px solid #00c4a7" }} />
                Sem exposição identificada
              </div>
            </div>
          </section>
        </aside>

        <section className="graph-section">
          <div className="graph-header">
            <h2 className="graph-title">Mapa de Contatos — Escritório</h2>
            <span className="graph-hint">Arraste os nós · Scroll para zoom · Hover para detalhes</span>
          </div>
          <div className="graph-container">
            {graphData && (
              <GraphCanvas
                nodes={graphData.nodes}
                edges={graphData.edges}
                exposureMap={exposureMap}
                sourceId={sourceId}
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
              <div className="ex-icon">🏢</div>
              <h3>Mapa de Contatos</h3>
              <p>Cada colaborador é um <strong>vértice</strong>. Conexões surgem por proximidade de sala, andar, departamento e sistema. Simula os contatos reais do dia a dia no escritório — sem rastreamento invasivo.</p>
            </div>
            <div className="ex-card">
              <div className="ex-icon">🔬</div>
              <h3>BFS — Onda de Contágio</h3>
              <p>O BFS explora a rede <strong>nível por nível</strong> a partir do Paciente Zero, exatamente como um vírus se propaga. Garante o <strong>menor caminho de infecção</strong>. Complexidade: <code>O(V + E)</code>.</p>
            </div>
            <div className="ex-card">
              <div className="ex-icon">📡</div>
              <h3>Resposta Imediata</h3>
              <p>Em <strong>milissegundos</strong>, o sistema identifica quem avisar (1º grau), quem monitorar (2º grau) e quais <strong>salas isolar</strong> — substituindo dias de rastreamento manual e ligações.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        Outbreak Tracker · Rastreamento de Surtos Corporativos · BFS Puro em Python · FastAPI + React + Canvas API
      </footer>
    </div>
  );
};

export default App;
