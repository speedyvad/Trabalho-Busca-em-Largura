"""
=============================================================================
OUTBREAK TRACKER — Backend FastAPI
=============================================================================
Rastreamento de surtos corporativos usando BFS (Busca em Largura).
Dado um Paciente Zero, mapeia todos os colaboradores em risco e o grau
de exposição de cada um no grafo de contatos do escritório.

Autor: Projeto Acadêmico — Algoritmos em Grafos
=============================================================================
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from collections import deque
from typing import Optional

# ─────────────────────────────────────────────
# Inicialização
# ─────────────────────────────────────────────
app = FastAPI(
    title="Outbreak Tracker API",
    description="Rastreamento de surtos corporativos com BFS puro em Python",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Modelo Pydantic
# ─────────────────────────────────────────────
class PathRequest(BaseModel):
    source_id: int
    target_id: int
    limit: Optional[int] = 25


# ─────────────────────────────────────────────
# FUNÇÕES AUXILIARES
# ─────────────────────────────────────────────

def geo_distance(u1: dict, u2: dict) -> float:
    """Distância euclidiana entre dois pontos geográficos (proxy de proximidade física)."""
    try:
        lat1 = float(u1["address"]["geo"]["lat"])
        lng1 = float(u1["address"]["geo"]["lng"])
        lat2 = float(u2["address"]["geo"]["lat"])
        lng2 = float(u2["address"]["geo"]["lng"])
        return ((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2) ** 0.5
    except Exception:
        return 9999.0


def build_graph(users: list) -> dict:
    """
    Constrói o grafo de contatos do escritório.

    Regras de conexão (simulam contatos reais):
      1. Mesma sala (city)                   — colegas de sala
      2. Mesmo departamento (company)        — mesma equipe
      3. Mesmo andar (prefixo CEP 2 dígitos) — cruzam no corredor
      4. Mesmo sistema/domínio de e-mail     — reuniões de área
      5. Proximidade física < 80 u           — salas adjacentes
      6. IDs próximos (|diff| ≤ 2)           — contratados juntos
    """
    graph: dict = {u["id"]: [] for u in users}

    def add_edge(a: int, b: int) -> None:
        if b not in graph[a]:
            graph[a].append(b)
        if a not in graph[b]:
            graph[b].append(a)

    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            u1, u2 = users[i], users[j]
            connected = False

            if u1["address"]["city"] == u2["address"]["city"]:
                connected = True
            if u1["company"]["name"] == u2["company"]["name"]:
                connected = True

            zip1 = u1["address"]["zipcode"].replace("-", "")[:2]
            zip2 = u2["address"]["zipcode"].replace("-", "")[:2]
            if zip1 == zip2:
                connected = True

            host1 = u1["email"].split("@")[-1].split(".")[0]
            host2 = u2["email"].split("@")[-1].split(".")[0]
            if host1 == host2:
                connected = True

            if geo_distance(u1, u2) < 80:
                connected = True

            if abs(u1["id"] - u2["id"]) <= 2:
                connected = True

            if connected:
                add_edge(u1["id"], u2["id"])

    return graph


def bfs(graph: dict, source: int, target: int):
    """
    BFS ponto-a-ponto: caminho mais curto entre dois nós.
    Retorna lista de IDs ou None se desconectados.
    Complexidade: O(V + E)
    """
    if source == target:
        return [source]

    visited: set = {source}
    queue: deque = deque([(source, [source])])

    while queue:
        current, path = queue.popleft()
        for neighbor in graph.get(current, []):
            if neighbor == target:
                return path + [neighbor]
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))

    return None


def bfs_all(graph: dict, source: int) -> dict:
    """
    BFS completo a partir de uma origem: retorna {node_id: distância}.
    Usado para mapear o alcance total do Paciente Zero.
    Complexidade: O(V + E)
    """
    distances: dict = {source: 0}
    queue: deque = deque([source])

    while queue:
        current = queue.popleft()
        for neighbor in graph.get(current, []):
            if neighbor not in distances:
                distances[neighbor] = distances[current] + 1
                queue.append(neighbor)

    return distances


async def fetch_users() -> list:
    from mock_data import MOCK_USERS
    return MOCK_USERS


def clamp_limit(limit: int) -> int:
    return max(3, min(25, limit))


def user_to_node(u: dict, degree: int) -> dict:
    return {
        "id": u["id"],
        "name": u["name"],
        "username": u["username"],
        "city": u["address"]["city"],
        "company": u["company"]["name"],
        "degree": degree,
        "lat": float(u["address"]["geo"]["lat"]),
        "lng": float(u["address"]["geo"]["lng"]),
    }


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "message": "Outbreak Tracker API v3 online"}


@app.get("/users")
async def get_users(limit: int = Query(default=25, ge=3, le=25)):
    all_users = await fetch_users()
    users = all_users[:clamp_limit(limit)]
    return {
        "count": len(users),
        "users": [
            {
                "id": u["id"],
                "name": u["name"],
                "username": u["username"],
                "email": u["email"],
                "city": u["address"]["city"],
                "company": u["company"]["name"],
                "website": u.get("website", ""),
                "lat": float(u["address"]["geo"]["lat"]),
                "lng": float(u["address"]["geo"]["lng"]),
            }
            for u in users
        ],
    }


@app.get("/graph")
async def get_graph(limit: int = Query(default=25, ge=3, le=25)):
    all_users = await fetch_users()
    users = all_users[:clamp_limit(limit)]
    graph = build_graph(users)

    edges = []
    seen: set = set()
    for uid, neighbors in graph.items():
        for nid in neighbors:
            key = tuple(sorted([uid, nid]))
            if key not in seen:
                seen.add(key)
                edges.append({"source": key[0], "target": key[1]})

    nodes = [user_to_node(u, len(graph[u["id"]])) for u in users]
    total_degree = sum(n["degree"] for n in nodes)

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "avg_degree": round(total_degree / len(nodes), 2) if nodes else 0,
            "max_degree": max(n["degree"] for n in nodes) if nodes else 0,
        },
    }


@app.get("/contagion-spread")
async def contagion_spread(
    source_id: int = Query(..., description="ID do Paciente Zero"),
    limit: int = Query(default=25, ge=3, le=25),
):
    """
    Mapeia todos os colaboradores atingíveis a partir do Paciente Zero,
    com o grau de exposição (distância BFS) de cada um.

    Retorna:
      - source: dados do Paciente Zero
      - exposed: lista de expostos ordenados por distância
      - by_degree: contagem por grau (1, 2, 3+)
      - total_exposed, total_safe
    """
    all_users = await fetch_users()
    users = all_users[:clamp_limit(limit)]
    user_map = {u["id"]: u for u in users}

    if source_id not in user_map:
        raise HTTPException(
            status_code=404,
            detail=f"Paciente Zero ID {source_id} não encontrado no grafo atual."
        )

    graph = build_graph(users)
    distances = bfs_all(graph, source_id)

    exposed = []
    for uid, u in user_map.items():
        if uid == source_id:
            continue
        dist = distances.get(uid)
        if dist is not None:
            exposed.append({
                "id": uid,
                "name": u["name"],
                "username": u["username"],
                "city": u["address"]["city"],
                "company": u["company"]["name"],
                "distance": dist,
            })

    exposed.sort(key=lambda x: x["distance"])

    by_degree: dict = {}
    for e in exposed:
        key = str(min(e["distance"], 3))
        by_degree[key] = by_degree.get(key, 0) + 1

    total_in_graph = len(users) - 1
    src = user_map[source_id]

    return {
        "source": {
            "id": source_id,
            "name": src["name"],
            "city": src["address"]["city"],
            "company": src["company"]["name"],
        },
        "exposed": exposed,
        "total_exposed": len(exposed),
        "total_safe": total_in_graph - len(exposed),
        "by_degree": by_degree,
        "message": (
            f"{len(exposed)} de {total_in_graph} colaboradores atingíveis "
            f"a partir de {src['name']}."
        ),
    }


@app.post("/shortest-path")
async def shortest_path(req: PathRequest):
    all_users = await fetch_users()
    users = all_users[:clamp_limit(req.limit or 25)]
    user_map = {u["id"]: u for u in users}
    valid_ids = set(user_map.keys())

    if req.source_id not in valid_ids:
        raise HTTPException(status_code=404,
                            detail=f"Usuário ID {req.source_id} não encontrado.")
    if req.target_id not in valid_ids:
        raise HTTPException(status_code=404,
                            detail=f"Usuário ID {req.target_id} não encontrado.")

    graph = build_graph(users)
    path = bfs(graph, req.source_id, req.target_id)

    if path is None:
        return {"exists": False, "path": [], "path_details": [],
                "distance": -1, "message": "Sem caminho (grafo desconectado)."}

    path_details = [
        {"id": uid, "name": user_map[uid]["name"],
         "username": user_map[uid]["username"],
         "city": user_map[uid]["address"]["city"],
         "company": user_map[uid]["company"]["name"]}
        for uid in path
    ]
    sep = len(path) - 1
    return {"exists": True, "path": path, "path_details": path_details,
            "distance": sep,
            "message": f"Caminho com {sep} grau(s) de separação."}


@app.get("/farthest-users")
async def farthest_users(limit: int = Query(default=25, ge=3, le=25)):
    """Diâmetro do grafo: os dois colaboradores mais distantes entre si."""
    all_users = await fetch_users()
    users = all_users[:clamp_limit(limit)]
    graph = build_graph(users)
    user_map = {u["id"]: u for u in users}
    ids = list(graph.keys())

    max_dist = -1
    farthest_path: list = []
    farthest_pair = (None, None)

    for i, source in enumerate(ids):
        for target in ids[i + 1:]:
            path = bfs(graph, source, target)
            if path and len(path) - 1 > max_dist:
                max_dist = len(path) - 1
                farthest_path = path
                farthest_pair = (source, target)

    if max_dist == -1:
        return {"message": "Grafo desconectado ou vazio."}

    path_details = [
        {"id": uid, "name": user_map[uid]["name"],
         "username": user_map[uid]["username"],
         "city": user_map[uid]["address"]["city"],
         "company": user_map[uid]["company"]["name"]}
        for uid in farthest_path
    ]

    return {
        "user1": {"id": farthest_pair[0], "name": user_map[farthest_pair[0]]["name"]},
        "user2": {"id": farthest_pair[1], "name": user_map[farthest_pair[1]]["name"]},
        "distance": max_dist,
        "path": farthest_path,
        "path_details": path_details,
        "message": f"Diâmetro do grafo: {max_dist} graus de separação.",
    }
