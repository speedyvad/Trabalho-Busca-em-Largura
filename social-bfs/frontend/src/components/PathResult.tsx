/**
 * PathResult.tsx — Exibe o resultado do rastreamento de contágio (SpreadResult).
 * Exporta SpreadResultPanel para uso em App.tsx.
 */

import React from "react";
import { SpreadResult } from "../api";

interface Props {
  result: SpreadResult | null;
  isLoading: boolean;
}

export const SpreadResultPanel: React.FC<Props> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="result-card loading-card">
        <div className="bfs-animation">
          <div className="bfs-ring" />
          <div className="bfs-ring" style={{ animationDelay: "0.35s" }} />
          <div className="bfs-ring" style={{ animationDelay: "0.7s" }} />
        </div>
        <p className="loading-text">Rastreando contágio...</p>
        <p className="loading-sub">BFS explorando o grafo nível por nível</p>
      </div>
    );
  }

  if (!result) return null;

  const direct   = result.by_degree["1"] ?? 0;
  const second   = result.by_degree["2"] ?? 0;
  const thirdUp  = result.by_degree["3"] ?? 0;
  const safe     = result.total_safe;

  // Salas únicas dos expostos em ordem de aparição
  const roomPath = [...new Set(result.exposed.map((e) => e.city))];

  const directContacts = result.exposed.filter((e) => e.distance === 1);

  return (
    <div className="result-card success-card">
      {/* Cabeçalho com badge */}
      <div className="result-header">
        <div className="result-badge">
          <span className="badge-number">{result.total_exposed}</span>
          <span className="badge-label">em risco</span>
        </div>
        <div className="result-title">
          <h3>Cadeia de contágio mapeada</h3>
          <p className="result-msg">
            Originado em <strong>{result.source.name}</strong> · {result.source.city}
          </p>
        </div>
      </div>

      {/* Rota de salas */}
      {roomPath.length > 0 && (
        <div className="room-route">
          <span className="room-route-label">ROTA&nbsp;</span>
          {roomPath.map((room, i) => (
            <React.Fragment key={room}>
              <span className="room-chip">{room}</span>
              {i < roomPath.length - 1 && (
                <span className="room-route-arrow">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Grade de graus de exposição */}
      <div className="exposure-grid">
        <div className="exp-item" style={{ borderColor: "#ff8142" }}>
          <span className="exp-num" style={{ color: "#ff8142" }}>{direct}</span>
          <span className="exp-label">Contato direto</span>
        </div>
        <div className="exp-item" style={{ borderColor: "#ffc04a" }}>
          <span className="exp-num" style={{ color: "#ffc04a" }}>{second}</span>
          <span className="exp-label">2º grau</span>
        </div>
        <div className="exp-item" style={{ borderColor: "#ffd166" }}>
          <span className="exp-num" style={{ color: "#ffd166" }}>{thirdUp}</span>
          <span className="exp-label">3º grau+</span>
        </div>
        <div className="exp-item" style={{ borderColor: "#06d6a0" }}>
          <span className="exp-num" style={{ color: "#06d6a0" }}>{safe}</span>
          <span className="exp-label">Seguros</span>
        </div>
      </div>

      {/* Lista de contatos diretos */}
      {directContacts.length > 0 && (
        <div className="path-steps">
          <p className="contacts-header">⚠ Avisar imediatamente (1º grau)</p>
          {directContacts.map((person, idx) => (
            <div
              key={person.id}
              className="path-node"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="node-avatar" style={{ background: "#ff8142" }}>
                <span className="node-id">{person.id}</span>
              </div>
              <div className="node-info">
                <span className="node-name">{person.name}</span>
                <span className="node-meta">{person.city} · {person.company}</span>
              </div>
              <span className="node-tag" style={{ background: "#ff8142" }}>1º grau</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
