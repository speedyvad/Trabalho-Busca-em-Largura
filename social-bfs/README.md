# 🕸️ Social BFS — Rede Social com Busca em Largura

> Projeto acadêmico completo: visualização de grafo social com algoritmo BFS implementado em **FastAPI + React + D3.js**

---

## 📁 Estrutura de Pastas

```
social-bfs/
├── backend/
│   ├── main.py           # FastAPI — lógica principal, BFS, endpoints
│   ├── mock_data.py      # Dados mock equivalentes ao JSONPlaceholder
│   └── requirements.txt  # Dependências Python
│
└── frontend/
    ├── public/
    └── src/
        ├── api.ts                        # Camada HTTP (axios)
        ├── App.tsx                       # Componente raiz
        ├── App.css                       # Design system completo
        └── components/
            ├── GraphCanvas.tsx           # Visualização D3.js
            ├── PathResult.tsx            # Exibição do resultado BFS
            └── StatsPanel.tsx            # Estatísticas e diâmetro do grafo
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- Python 3.10+
- Node.js 18+ e npm

---

### 1. Backend (FastAPI)

```bash
# Entrar na pasta do backend
cd social-bfs/backend

# Criar ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor
uvicorn main:app --reload --port 8000
```

O backend estará disponível em: **http://localhost:8000**

Documentação interativa (Swagger): **http://localhost:8000/docs**

---

### 2. Frontend (React)

```bash
# Em outro terminal, entrar na pasta do frontend
cd social-bfs/frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm start
```

O frontend estará disponível em: **http://localhost:3000**

---

## 🔌 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Status da API |
| GET | `/users` | Lista todos os usuários |
| GET | `/graph` | Estrutura completa do grafo (nós + arestas + stats) |
| POST | `/shortest-path` | Caminho BFS entre dois usuários |
| GET | `/farthest-users` | Dois usuários mais distantes (diâmetro do grafo) |

### Exemplo: POST /shortest-path

**Requisição:**
```json
{
  "source_id": 1,
  "target_id": 7
}
```

**Resposta:**
```json
{
  "exists": true,
  "path": [1, 5, 7],
  "path_details": [
    { "id": 1, "name": "Leanne Graham", "city": "Gwenborough", "company": "Romaguera-Crona" },
    { "id": 5, "name": "Chelsey Dietrich", "city": "Roscoeview",  "company": "Keebler LLC" },
    { "id": 7, "name": "Kurtis Weissnat", "city": "Howemouth",   "company": "Johns Group" }
  ],
  "distance": 2,
  "message": "Caminho encontrado com 2 grau(s) de separação."
}
```

---

## 🧠 Explicação Didática

### Como o Grafo é Construído

Usuários da API JSONPlaceholder são os **vértices**. Duas arestas são criadas entre usuários que compartilham ao menos uma das regras:

| Regra | Critério |
|-------|----------|
| 1 | Mesma cidade (`address.city`) |
| 2 | Mesma empresa (`company.name`) |
| 3 | Mesmo prefixo de CEP (2 primeiros dígitos) |
| 4 | Mesmo domínio base de e-mail |
| 5 | Proximidade geográfica (distância euclidiana lat/lng < 80) |
| 6 | IDs próximos (diferença ≤ 2) — simula "pessoas que você talvez conheça" |

Resultado: grafo com **10 vértices** e **~25 arestas**, com múltiplos caminhos possíveis.

### Como o BFS Funciona

```
BFS(grafo, origem, destino):
  fila ← [(origem, [origem])]
  visitados ← {origem}

  enquanto fila não vazia:
    (atual, caminho) ← fila.dequeue()

    para cada vizinho de atual:
      se vizinho == destino:
        retorna caminho + [vizinho]   ← caminho mais curto!

      se vizinho não visitado:
        visitados.add(vizinho)
        fila.enqueue((vizinho, caminho + [vizinho]))

  retorna None  ← sem caminho
```

**Por que BFS garante o caminho mais curto?**  
Porque explora o grafo *nível a nível*: primeiro todos os vizinhos diretos (distância 1), depois os vizinhos dos vizinhos (distância 2), e assim por diante. O primeiro caminho encontrado até o destino é necessariamente o mais curto.

### Comunicação Frontend ↔ Backend

```
React (porta 3000)                     FastAPI (porta 8000)
       │                                      │
       │── GET /graph ─────────────────────► │
       │◄── { nodes, edges, stats } ─────── │
       │                                      │
       │── POST /shortest-path ────────────► │
       │   { source_id: 1, target_id: 7 }    │  ← executa BFS()
       │◄── { path, distance, details } ─── │
       │                                      │
       │  D3.js renderiza o grafo             │
       │  e destaca o caminho em âmbar        │
```

---

## 🎨 Interface

- **Dark theme** sci-fi com design system próprio
- **Grafo interativo D3.js**: arrastar nós, zoom, pan, tooltips
- **Caminho BFS** destacado em âmbar com glow visual
- **Origem** em verde, **Destino** em vermelho
- **Animações**: entrada dos nós, loader BFS animado, revelação do caminho
- **Responsivo**: layout adaptável para telas menores

---

## 🛠️ Tecnologias

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | Python | 3.10+ |
| Web Framework | FastAPI | 0.115 |
| HTTP Client (back) | httpx | 0.27 |
| Frontend | React | 18 |
| Linguagem | TypeScript | 5 |
| Visualização | D3.js | 7 |
| HTTP Client (front) | axios | 1.x |
| Fonte de dados | JSONPlaceholder | — |

---

## 📌 Observações

- Em ambientes sem acesso à internet, o backend usa automaticamente os dados mock em `mock_data.py`, que são **idênticos** em estrutura à API JSONPlaceholder real.
- Para produção, o `fetch_users()` tenta primeiro a API real e só usa o fallback em caso de erro.
- O algoritmo de diâmetro (`/farthest-users`) executa BFS de cada nó, com complexidade `O(V×(V+E))` — adequado para grafos pequenos como este.
