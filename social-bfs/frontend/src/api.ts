/**
 * api.ts — Camada de comunicação com o backend FastAPI
 * Todos os endpoints do backend são consumidos aqui via axios.
 */

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  city: string;
  company: string;
  website: string;
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: number;
  name: string;
  username: string;
  city: string;
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

export interface PathDetail {
  id: number;
  name: string;
  username: string;
  city: string;
  company: string;
}

export interface ShortestPathResult {
  exists: boolean;
  path: number[];
  path_details: PathDetail[];
  distance: number;
  message: string;
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

export const fetchUsers = async (limit: number = 15): Promise<User[]> => {
  const res = await api.get("/users", { params: { limit } });
  return res.data.users;
};

export const fetchGraph = async (limit: number = 15): Promise<GraphData> => {
  const res = await api.get("/graph", { params: { limit } });
  return res.data;
};

export const findShortestPath = async (
  sourceId: number,
  targetId: number,
  limit: number = 15
): Promise<ShortestPathResult> => {
  const res = await api.post("/shortest-path", {
    source_id: sourceId,
    target_id: targetId,
    limit,
  });
  return res.data;
};

export const findFarthestUsers = async (limit: number = 15): Promise<FarthestUsersResult> => {
  const res = await api.get("/farthest-users", { params: { limit } });
  return res.data;
};
