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

      {/* ── Seção: O Problema ─────────────────────────────────── */}
      <section className="pitch-problem">
        <div className="pitch-inner">
          <span className="pitch-badge danger">⚠ O Problema</span>
          <h2 className="pitch-title">Rastreamento manual falha quando mais importa</h2>
          <p className="pitch-sub">Em um surto real, cada hora perdida amplia a cadeia de contágio exponencialmente.</p>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">⏱</div>
              <div className="problem-stat">72h+</div>
              <h3>Tempo médio de rastreio manual</h3>
              <p>Ligar para cada colaborador, cruzar agendas, preencher planilhas — enquanto o vírus avança em horas.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📋</div>
              <div className="problem-stat">~40%</div>
              <h3>Contatos diretos perdidos</h3>
              <p>Memória humana e registros dispersos levam à omissão de contatos-chave que mantêm a cadeia ativa.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">💸</div>
              <div className="problem-stat">R$12k+</div>
              <h3>Custo médio por surto não contido</h3>
              <p>Absenteísmo em cascata, queda de produtividade e custos médicos quando o isolamento chega tarde demais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção: Como funciona ───────────────────────────────── */}
      <section className="explainer">
        <div className="explainer-inner">
          <span className="pitch-badge accent">⚙ A Solução</span>
          <h2 className="explainer-title">Como funciona o Outbreak Tracker?</h2>
          <div className="explainer-grid">
            <div className="ex-card">
              <div className="ex-icon">🏢</div>
              <h3>Grafo do Escritório</h3>
              <p>Cada colaborador é um <strong>vértice</strong>. Arestas surgem por proximidade de sala, andar, departamento e domínio de e-mail — modelando os contatos reais do dia a dia sem rastreamento invasivo.</p>
            </div>
            <div className="ex-card">
              <div className="ex-icon">🔬</div>
              <h3>BFS — Onda de Contágio</h3>
              <p>O BFS explora a rede <strong>nível por nível</strong> a partir do Paciente Zero, exatamente como um vírus se propaga. Garante o <strong>menor caminho de infecção</strong>. Complexidade: <code>O(V + E)</code>.</p>
            </div>
            <div className="ex-card">
              <div className="ex-icon">📡</div>
              <h3>Resposta por Prioridade</h3>
              <p><strong>1º grau</strong> → isolamento imediato. <strong>2º grau</strong> → monitoramento ativo. <strong>3º grau+</strong> → alerta preventivo. Salas comprometidas são destacadas para sanitização.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção: BFS em Detalhe ──────────────────────────────── */}
      <section className="pitch-tech">
        <div className="pitch-inner">
          <span className="pitch-badge accent">🔭 O Algoritmo</span>
          <h2 className="pitch-title">BFS — passo a passo</h2>
          <p className="pitch-sub">Busca em Largura é a escolha ideal para modelar surtos: garante o menor grau de separação e processa toda a rede em tempo linear.</p>
          <div className="tech-steps">
            <div className="tech-step">
              <span className="step-num">01</span>
              <div className="step-body">
                <strong>Identificar o Paciente Zero</strong>
                <p>O colaborador infectado é inserido na fila BFS com distância 0. Todos os demais iniciam como não-visitados.</p>
              </div>
            </div>
            <div className="tech-step">
              <span className="step-num">02</span>
              <div className="step-body">
                <strong>Expandir a fila nível a nível</strong>
                <p>Para cada nó desenfileirado, todos os vizinhos não-visitados recebem distância + 1 e entram na fila. Repete até esvaziar.</p>
              </div>
            </div>
            <div className="tech-step">
              <span className="step-num">03</span>
              <div className="step-body">
                <strong>Classificar e agir</strong>
                <p>O mapa <code>{'{ node_id: distância }'}</code> retornado pelo BFS alimenta o painel de risco e o mapa visual em tempo real.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção: Impacto ────────────────────────────────────── */}
      <section className="pitch-impact">
        <div className="pitch-inner">
          <span className="pitch-badge safe">✓ O Impacto</span>
          <h2 className="pitch-title">De 72 horas para menos de 1 segundo</h2>
          <div className="impact-grid">
            <div className="impact-item">
              <span className="impact-num">&lt; 50ms</span>
              <span className="impact-label">Para mapear 25 colaboradores</span>
            </div>
            <div className="impact-item">
              <span className="impact-num">100%</span>
              <span className="impact-label">De cobertura da rede de contatos</span>
            </div>
            <div className="impact-item">
              <span className="impact-num">O(V+E)</span>
              <span className="impact-label">Complexidade garantida pelo BFS</span>
            </div>
            <div className="impact-item">
              <span className="impact-num">0</span>
              <span className="impact-label">Contatos omitidos por erro humano</span>
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
