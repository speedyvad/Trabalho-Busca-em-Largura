/**
 * api.ts — Camada de comunicação com o Outbreak Tracker API
 */

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: BASE_URL });

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;   // sala do escritório
  company: string;
  website: string;
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: number;
  name: string;
  username: string;
  city: string;   // sala do escritório
  company: string;
  degree: number;
  lat: number;
  lng: number;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    avg_degree: number;
    max_degree: number;
  };
}

export interface ExposedPerson {
  id: number;
  name: string;
  username: string;
  city: string;
  company: string;
  distance: number;
}

export interface SpreadResult {
  source: { id: number; name: string; city: string; company: string };
  exposed: ExposedPerson[];
  total_exposed: number;
  total_safe: number;
  by_degree: Record<string, number>;
  message: string;
}

export interface PathDetail {
  id: number;
  name: string;
  username: string;
  city: string;
  company: string;
}

export interface FarthestUsersResult {
  user1: { id: number; name: string };
  user2: { id: number; name: string };
  distance: number;
  path: number[];
  path_details: PathDetail[];
  message: string;
}

// ── Chamadas à API ────────────────────────────────────────────────────────────

export const fetchUsers = async (limit: number = 25): Promise<User[]> => {
  const res = await api.get("/users", { params: { limit } });
  return res.data.users;
};

export const fetchGraph = async (limit: number = 25): Promise<GraphData> => {
  const res = await api.get("/graph", { params: { limit } });
  return res.data;
};

export const findSpread = async (
  sourceId: number,
  limit: number = 25
): Promise<SpreadResult> => {
  const res = await api.get("/contagion-spread", {
    params: { source_id: sourceId, limit },
  });
  return res.data;
};

export const findFarthestUsers = async (
  limit: number = 25
): Promise<FarthestUsersResult> => {
  const res = await api.get("/farthest-users", { params: { limit } });
  return res.data;
};
