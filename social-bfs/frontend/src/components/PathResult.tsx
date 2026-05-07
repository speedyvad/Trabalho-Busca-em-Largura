/**
 * PathResult.tsx — Componente para exibição do resultado BFS
 * Mostra o caminho passo a passo com animação de entrada.
 */

import React from "react";
import { ShortestPathResult } from "../api";

interface Props {
  result: ShortestPathResult | null;
  isLoading: boolean;
}

export const PathResult: React.FC<Props> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="result-card loading-card">
        <div className="bfs-animation">
          <div className="bfs-ring" />
          <div className="bfs-ring" style={{ animationDelay: "0.2s" }} />
          <div className="bfs-ring" style={{ animationDelay: "0.4s" }} />
        </div>
        <p className="loading-text">Executando BFS...</p>
        <p className="loading-sub">Explorando o grafo nível por nível</p>
      </div>
    );
  }

  if (!result) return null;

  if (!result.exists) {
    return (
      <div className="result-card error-card">
        <div className="result-icon">⚠️</div>
        <h3>Sem caminho encontrado</h3>
        <p>{result.message}</p>
      </div>
    );
  }

  return (
    <div className="result-card success-card">
      <div className="result-header">
        <div className="result-badge">
          <span className="badge-number">{result.distance}</span>
          <span className="badge-label">
            {result.distance === 1 ? "salto" : "saltos"}
          </span>
        </div>
        <div className="result-title">
          <h3>Caminho mais curto encontrado</h3>
          <p className="result-msg">{result.message}</p>
        </div>
      </div>

      <div className="path-steps">
        {result.path_details.map((user, idx) => (
          <React.Fragment key={user.id}>
            <div
              className={`path-node ${idx === 0 ? "source-node" : ""} ${
                idx === result.path_details.length - 1 ? "target-node" : ""
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="node-avatar">
                <span className="node-id">{user.id}</span>
              </div>
              <div className="node-info">
                <span className="node-name">{user.name}</span>
                <span className="node-meta">
                  {user.city} · {user.company}
                </span>
              </div>
              {idx === 0 && <span className="node-tag source-tag">Origem</span>}
              {idx === result.path_details.length - 1 && (
                <span className="node-tag target-tag">Destino</span>
              )}
            </div>
            {idx < result.path_details.length - 1 && (
              <div className="path-arrow">↓</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
