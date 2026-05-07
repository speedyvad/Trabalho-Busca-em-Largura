"""
=============================================================================
REDE SOCIAL BFS - Backend FastAPI
=============================================================================
Implementação do algoritmo BFS (Busca em Largura) para encontrar o caminho
mais curto entre usuários em uma rede social simulada.

Fonte de dados: mock_data.py (15 usuários) com fallback para JSONPlaceholder.
Autor: Projeto Acadêmico - Algoritmos em Grafos
=============================================================================
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from collections import deque
from typing import Optional

# ─────────────────────────────────────────────
# Inicialização da aplicação
# ─────────────────────────────────────────────
app = FastAPI(
    title="Social Network BFS API",
    description="API para análise de grafos em redes sociais usando BFS",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Modelo Pydantic para requisição
# ─────────────────────────────────────────────
class PathRequest(BaseModel):
    source_id: int
    target_id: int
    limit: Optional[int] = 15


# ─────────────────────────────────────────────
# FUNÇÕES AUXILIARES
# ─────────────────────────────────────────────

def geo_distance(u1: dict, u2: dict) -> float:
    """Distância euclidiana simples entre dois pontos geográficos."""
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
    Constrói o grafo de amizades a partir da lista de usuários.

    Regras de conexão simulam relacionamentos reais em redes sociais:
      1. Mesma cidade                   -> vizinhos / locais
      2. Mesma empresa                  -> colegas de trabalho
      3. Mesmo prefixo de CEP (2 dig.)  -> bairro próximo
      4. Mesmo host de e-mail           -> comunidade online
      5. Proximidade geográfica < 80    -> distância euclidiana lat/lng
      6. IDs próximos (diff <= 2)       -> "pessoas que você talvez conheça"

    Retorna: dict { id_usuario: [lista de vizinhos] }
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

            # Regra 1: Mesma cidade
            if u1["address"]["city"] == u2["address"]["city"]:
                connected = True

            # Regra 2: Mesma empresa
            if u1["company"]["name"] == u2["company"]["name"]:
                connected = True

            # Regra 3: Mesmo prefixo de CEP (2 primeiros dígitos)
            zip1 = u1["address"]["zipcode"].replace("-", "")[:2]
            zip2 = u2["address"]["zipcode"].replace("-", "")[:2]
            if zip1 == zip2:
                connected = True

            # Regra 4: Mesmo domínio base de e-mail
            host1 = u1["email"].split("@")[-1].split(".")[0]
            host2 = u2["email"].split("@")[-1].split(".")[0]
            if host1 == host2:
                connected = True

            # Regra 5: Proximidade geográfica (distância euclidiana lat/lng)
            if geo_distance(u1, u2) < 80:
                connected = True

            # Regra 6: IDs próximos (simulando sugestões da plataforma)
            if abs(u1["id"] - u2["id"]) <= 2:
                connected = True

            if connected:
                add_edge(u1["id"], u2["id"])

    return graph


def bfs(graph: dict, source: int, target: int):
    """
    Algoritmo de Busca em Largura (BFS) para caminho mais curto.

    Como funciona:
      1. Inicia uma fila com o nó de origem
      2. A cada iteração, retira o primeiro elemento da fila (FIFO)
      3. Verifica todos os seus vizinhos não visitados
      4. Se encontrar o destino, retorna o caminho reconstituído
      5. Caso contrário, adiciona os vizinhos à fila e continua

    Garantia: o BFS sempre encontra o caminho com MENOS arestas.
    Complexidade de tempo: O(V + E)
    Complexidade de espaço: O(V)

    Retorna: lista de IDs do caminho, ou None se desconectado.
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


async def fetch_users() -> list:
    """
    Busca usuários da API pública JSONPlaceholder.
    Em ambientes sem acesso externo, utiliza os 15 dados mock.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://jsonplaceholder.typicode.com/users",
                headers={"User-Agent": "SocialBFS/2.0"}
            )
            resp.raise_for_status()
            data = resp.json()
            # JSONPlaceholder só tem 10 usuários; complementar com mock para ter 15
            from mock_data import MOCK_USERS
            existing_ids = {u["id"] for u in data}
            extra = [u for u in MOCK_USERS if u["id"] not in existing_ids]
            return data + extra
    except Exception:
        from mock_data import MOCK_USERS
        return MOCK_USERS


def clamp_limit(limit: int) -> int:
    return max(3, min(15, limit))


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "message": "Social Network BFS API v2 online"}


@app.get("/users")
async def get_users(limit: int = Query(default=15, ge=3, le=15)):
    """Lista usuários da rede social. O parâmetro limit filtra os primeiros N usuários."""
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
async def get_graph(limit: int = Query(default=15, ge=3, le=15)):
    """
    Retorna a estrutura completa do grafo:
    - nodes: lista de vértices com metadados
    - edges: lista de arestas (pares de IDs)
    - stats: estatísticas gerais do grafo

    O parâmetro limit define quantos usuários incluir no grafo.
    """
    all_users = await fetch_users()
    users = all_users[:clamp_limit(limit)]
    graph = build_graph(users)

    edges = []
    seen: set = set()
    for uid, neighbors in graph.items():
        for nid in neighbors:
            edge_key = tuple(sorted([uid, nid]))
            if edge_key not in seen:
                seen.add(edge_key)
                edges.append({"source": edge_key[0], "target": edge_key[1]})

    nodes = [
        {
            "id": u["id"],
            "name": u["name"],
            "username": u["username"],
            "city": u["address"]["city"],
            "company": u["company"]["name"],
            "degree": len(graph[u["id"]]),
            "lat": float(u["address"]["geo"]["lat"]),
            "lng": float(u["address"]["geo"]["lng"]),
        }
        for u in users
    ]

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


@app.post("/shortest-path")
async def shortest_path(req: PathRequest):
    """
    Encontra o caminho mais curto entre dois usuários usando BFS.

    Body JSON: { "source_id": 1, "target_id": 8, "limit": 15 }

    Retorna caminho, detalhes de cada nó e número de saltos.
    """
    all_users = await fetch_users()
    users = all_users[:clamp_limit(req.limit or 15)]
    user_map = {u["id"]: u for u in users}
    valid_ids = set(user_map.keys())

    if req.source_id not in valid_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Usuário com ID {req.source_id} não encontrado no grafo atual."
        )
    if req.target_id not in valid_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Usuário com ID {req.target_id} não encontrado no grafo atual."
        )

    graph = build_graph(users)
    path = bfs(graph, req.source_id, req.target_id)

    if path is None:
        return {
            "exists": False,
            "path": [],
            "path_details": [],
            "distance": -1,
            "message": "Sem caminho entre os usuários (grafo desconectado).",
        }

    path_details = [
        {
            "id": uid,
            "name": user_map[uid]["name"],
            "username": user_map[uid]["username"],
            "city": user_map[uid]["address"]["city"],
            "company": user_map[uid]["company"]["name"],
        }
        for uid in path
    ]

    separation = len(path) - 1
    return {
        "exists": True,
        "path": path,
        "path_details": path_details,
        "distance": separation,
        "message": f"Caminho encontrado com {separation} grau(s) de separação.",
    }


@app.get("/farthest-users")
async def farthest_users(limit: int = Query(default=15, ge=3, le=15)):
    """
    Calcula o diâmetro do grafo: encontra os dois usuários mais distantes.

    Executa BFS a partir de cada vértice e mantém o maior caminho.
    Complexidade: O(V x (V + E))
    """
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
        {
            "id": uid,
            "name": user_map[uid]["name"],
            "username": user_map[uid]["username"],
            "city": user_map[uid]["address"]["city"],
            "company": user_map[uid]["company"]["name"],
        }
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
