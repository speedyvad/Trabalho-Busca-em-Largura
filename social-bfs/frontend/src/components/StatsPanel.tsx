/**
 * StatsPanel.tsx — Estatísticas do grafo de contatos e diâmetro da rede.
 */

import React, { useState } from "react";
import { GraphData, FarthestUsersResult, findFarthestUsers } from "../api";

interface Props {
  graphData: GraphData | null;
  userLimit: number;
  onFarthestFound: (result: FarthestUsersResult) => void;
}

export const StatsPanel: React.FC<Props> = ({ graphData, userLimit, onFarthestFound }) => {
  const [farthest, setFarthest] = useState<FarthestUsersResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleFarthest = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await findFarthestUsers(userLimit);
      setFarthest(result);
      onFarthestFound(result);
    } catch {
      setError("Erro ao calcular diâmetro da rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stats-panel">
      <h3 className="stats-title">Estatísticas da Rede</h3>

      {graphData && (
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{graphData.stats.total_nodes}</span>
            <span className="stat-label">Colaboradores</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{graphData.stats.total_edges}</span>
            <span className="stat-label">Contatos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{graphData.stats.avg_degree}</span>
            <span className="stat-label">Média de contatos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{graphData.stats.max_degree}</span>
            <span className="stat-label">Maior alcance</span>
          </div>
        </div>
      )}

      <button className="btn-farthest" onClick={handleFarthest} disabled={loading}>
        {loading
          ? <span className="btn-spinner">⟳ Calculando...</span>
          : "🔭 Encontrar maior cadeia de contágio"}
      </button>

      {error && <p className="error-text">{error}</p>}

      {farthest && (
        <div className="farthest-result">
          <div className="farthest-header">
            <span className="farthest-icon">📡</span>
            <span>Diâmetro da rede: <strong>{farthest.distance}</strong> saltos</span>
          </div>
          <div className="farthest-pair">
            <div className="farthest-user source-color">
              <span className="fuser-id">#{farthest.user1.id}</span>
              <span className="fuser-name">{farthest.user1.name}</span>
            </div>
            <div className="farthest-sep">⟷</div>
            <div className="farthest-user target-color">
              <span className="fuser-id">#{farthest.user2.id}</span>
              <span className="fuser-name">{farthest.user2.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
