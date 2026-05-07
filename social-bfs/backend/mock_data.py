"""
Dados mock — 25 colaboradores distribuídos em 8 salas do escritório.
address.city  = nome da sala (usado pela regra "mesma sala" no grafo)
address.geo   = coordenada da sala numa grade 70-unit × 70-unit
                salas adjacentes ficam a 70 u (< limiar 80) → conectadas
Andares / grade:

  Andar 1:  Recepção(5,5)   TI(5,75)    Financeiro(5,145)
  Andar 2:  Diretoria(75,5) RH(75,75)   Comercial(75,145)
  Andar 3:  Jurídico(145,5) Operações(145,75)

E-mail domains cruzam departamentos:
  @empresa.com   → RH + Diretoria + Recepção   (andar executivo)
  @techcorp.dev  → TI
  @fin.corp      → Financeiro
  @vendas.io     → Comercial + Operações
  @juridico.com  → Jurídico

CEP prefix:
  01 → Andar 1: Recepção, TI, Financeiro
  02 → Andar 2: Diretoria, RH, Comercial
  03 → Andar 3: Jurídico, Operações
"""

MOCK_USERS = [
    # ── Recepção — Andar 1, lat≈5, lng≈5 ──────────────────────────────────────
    {
        "id": 1, "name": "Leanne Graham", "username": "leannegraham",
        "email": "leanne.graham@empresa.com",
        "address": {"street": "Balcão Principal", "suite": "Entrada",
                    "city": "Recepção", "zipcode": "01001-001",
                    "geo": {"lat": "3.7", "lng": "3.4"}},
        "phone": "11-99000-0001", "website": "leannegraham.org",
        "company": {"name": "Recepção & Facilities",
                    "catchPhrase": "Primeiro contato", "bs": "manage visitor flow"}
    },
    {
        "id": 2, "name": "Clementina DuBuque", "username": "clementinadu",
        "email": "clementina.dubuque@empresa.com",
        "address": {"street": "Balcão Secundário", "suite": "Entrada",
                    "city": "Recepção", "zipcode": "01001-001",
                    "geo": {"lat": "6.3", "lng": "6.7"}},
        "phone": "11-99000-0002", "website": "clementinadu.net",
        "company": {"name": "Recepção & Facilities",
                    "catchPhrase": "Atendimento premium", "bs": "coordinate facilities"}
    },

    # ── TI / Desenvolvimento — Andar 1, lat≈5, lng≈75 ─────────────────────────
    {
        "id": 3, "name": "João Silva", "username": "joaosilva",
        "email": "joao.silva@techcorp.dev",
        "address": {"street": "Mesa 1-TI", "suite": "Bloco Dev",
                    "city": "TI", "zipcode": "01002-100",
                    "geo": {"lat": "3.2", "lng": "73.1"}},
        "phone": "11-99001-0003", "website": "joaosilva.dev",
        "company": {"name": "Depto. de Tecnologia",
                    "catchPhrase": "Inovação contínua", "bs": "build scalable systems"}
    },
    {
        "id": 4, "name": "Mariana Costa", "username": "marianacosta",
        "email": "mariana.costa@techcorp.dev",
        "address": {"street": "Mesa 2-TI", "suite": "Bloco Dev",
                    "city": "TI", "zipcode": "01002-100",
                    "geo": {"lat": "6.8", "lng": "77.3"}},
        "phone": "11-99001-0004", "website": "marianacosta.io",
        "company": {"name": "Depto. de Tecnologia",
                    "catchPhrase": "Código limpo", "bs": "deliver fast features"}
    },
    {
        "id": 5, "name": "Carlos Oliveira", "username": "carlosoliv",
        "email": "carlos.oliveira@techcorp.dev",
        "address": {"street": "Mesa 3-TI", "suite": "Bloco Dev",
                    "city": "TI", "zipcode": "01002-100",
                    "geo": {"lat": "4.5", "lng": "76.2"}},
        "phone": "11-99001-0005", "website": "carlosoliv.com",
        "company": {"name": "Depto. de Tecnologia",
                    "catchPhrase": "DevOps specialist", "bs": "automate everything"}
    },
    {
        "id": 6, "name": "Rafael Santos", "username": "rafaelsantos",
        "email": "rafael.santos@techcorp.dev",
        "address": {"street": "Mesa 4-TI", "suite": "Bloco Dev",
                    "city": "TI", "zipcode": "01002-100",
                    "geo": {"lat": "7.1", "lng": "74.8"}},
        "phone": "11-99001-0006", "website": "rafaelsantos.dev",
        "company": {"name": "Depto. de Tecnologia",
                    "catchPhrase": "Full stack ninja", "bs": "ship products daily"}
    },

    # ── Financeiro — Andar 1, lat≈5, lng≈145 ─────────────────────────────────
    {
        "id": 7, "name": "Patricia Lima", "username": "patricialima",
        "email": "patricia.lima@fin.corp",
        "address": {"street": "Mesa 1-Fin", "suite": "Bloco Financeiro",
                    "city": "Financeiro", "zipcode": "01003-200",
                    "geo": {"lat": "3.8", "lng": "143.5"}},
        "phone": "11-99002-0007", "website": "patricialima.biz",
        "company": {"name": "Financeiro & Controladoria",
                    "catchPhrase": "Números precisos", "bs": "maximize ROI"}
    },
    {
        "id": 8, "name": "Eduardo Moreira", "username": "eduardomoreira",
        "email": "eduardo.moreira@fin.corp",
        "address": {"street": "Mesa 2-Fin", "suite": "Bloco Financeiro",
                    "city": "Financeiro", "zipcode": "01003-200",
                    "geo": {"lat": "6.2", "lng": "146.7"}},
        "phone": "11-99002-0008", "website": "eduardomoreira.net",
        "company": {"name": "Financeiro & Controladoria",
                    "catchPhrase": "Auditoria eficiente", "bs": "optimize budgets"}
    },
    {
        "id": 9, "name": "Bianca Alves", "username": "biancaalves",
        "email": "bianca.alves@fin.corp",
        "address": {"street": "Mesa 3-Fin", "suite": "Bloco Financeiro",
                    "city": "Financeiro", "zipcode": "01003-200",
                    "geo": {"lat": "4.9", "lng": "144.9"}},
        "phone": "11-99002-0009", "website": "biancaalves.com",
        "company": {"name": "Financeiro & Controladoria",
                    "catchPhrase": "Controle total", "bs": "reduce costs"}
    },

    # ── Diretoria — Andar 2, lat≈75, lng≈5 ───────────────────────────────────
    {
        "id": 10, "name": "Roberto Almeida", "username": "robertoalmeida",
        "email": "roberto.almeida@empresa.com",
        "address": {"street": "Sala Executiva A", "suite": "Bloco Dir",
                    "city": "Diretoria", "zipcode": "02001-300",
                    "geo": {"lat": "73.2", "lng": "3.5"}},
        "phone": "11-99003-0010", "website": "robertoalmeida.com",
        "company": {"name": "Diretoria Executiva",
                    "catchPhrase": "Visão estratégica", "bs": "lead market disruption"}
    },
    {
        "id": 11, "name": "Glenna Reichert", "username": "glennareicher",
        "email": "glenna.reichert@empresa.com",
        "address": {"street": "Sala Executiva B", "suite": "Bloco Dir",
                    "city": "Diretoria", "zipcode": "02001-300",
                    "geo": {"lat": "77.3", "lng": "6.8"}},
        "phone": "11-99003-0011", "website": "glennareicher.net",
        "company": {"name": "Diretoria Executiva",
                    "catchPhrase": "Resultados sustentáveis", "bs": "pivot to growth"}
    },
    {
        "id": 12, "name": "Amir Khoury", "username": "amirkhoury",
        "email": "amir.khoury@empresa.com",
        "address": {"street": "Sala Executiva C", "suite": "Bloco Dir",
                    "city": "Diretoria", "zipcode": "02001-300",
                    "geo": {"lat": "75.5", "lng": "4.9"}},
        "phone": "11-99003-0012", "website": "amirkhoury.exec",
        "company": {"name": "Diretoria Executiva",
                    "catchPhrase": "Inovação global", "bs": "scale international markets"}
    },

    # ── RH — Andar 2, lat≈75, lng≈75 ─────────────────────────────────────────
    {
        "id": 13, "name": "Sofia Rodrigues", "username": "sofiarodrigues",
        "email": "sofia.rodrigues@empresa.com",
        "address": {"street": "Mesa 1-RH", "suite": "Bloco RH",
                    "city": "RH", "zipcode": "02002-400",
                    "geo": {"lat": "73.4", "lng": "72.8"}},
        "phone": "11-99004-0013", "website": "sofiarodrigues.hr",
        "company": {"name": "Recursos Humanos",
                    "catchPhrase": "Pessoas em primeiro lugar", "bs": "attract top talent"}
    },
    {
        "id": 14, "name": "Dennis Schulist", "username": "dennisschul",
        "email": "dennis.schulist@empresa.com",
        "address": {"street": "Mesa 2-RH", "suite": "Bloco RH",
                    "city": "RH", "zipcode": "02002-400",
                    "geo": {"lat": "77.1", "lng": "76.5"}},
        "phone": "11-99004-0014", "website": "dennisschul.org",
        "company": {"name": "Recursos Humanos",
                    "catchPhrase": "Cultura organizacional", "bs": "build great teams"}
    },
    {
        "id": 15, "name": "Camila Ferreira", "username": "camilaferreira",
        "email": "camila.ferreira@empresa.com",
        "address": {"street": "Mesa 3-RH", "suite": "Bloco RH",
                    "city": "RH", "zipcode": "02002-400",
                    "geo": {"lat": "75.6", "lng": "74.2"}},
        "phone": "11-99004-0015", "website": "camilaferreira.hr",
        "company": {"name": "Recursos Humanos",
                    "catchPhrase": "Treinamento eficaz", "bs": "develop human capital"}
    },

    # ── Comercial — Andar 2, lat≈75, lng≈145 ─────────────────────────────────
    {
        "id": 16, "name": "Kurtis Weissnat", "username": "kurtisweiss",
        "email": "kurtis.weissnat@vendas.io",
        "address": {"street": "Mesa 1-Com", "suite": "Bloco Comercial",
                    "city": "Comercial", "zipcode": "02003-500",
                    "geo": {"lat": "72.8", "lng": "143.1"}},
        "phone": "11-99005-0016", "website": "kurtisweiss.io",
        "company": {"name": "Comercial e Vendas",
                    "catchPhrase": "Fechando negócios", "bs": "expand market share"}
    },
    {
        "id": 17, "name": "Nicholas Souza", "username": "nicholassouza",
        "email": "nicholas.souza@vendas.io",
        "address": {"street": "Mesa 2-Com", "suite": "Bloco Comercial",
                    "city": "Comercial", "zipcode": "02003-500",
                    "geo": {"lat": "76.4", "lng": "147.2"}},
        "phone": "11-99005-0017", "website": "nicholassouza.com",
        "company": {"name": "Comercial e Vendas",
                    "catchPhrase": "Metas superadas", "bs": "upsell premium tiers"}
    },
    {
        "id": 18, "name": "Fernanda Lima", "username": "fernandalima",
        "email": "fernanda.lima@vendas.io",
        "address": {"street": "Mesa 3-Com", "suite": "Bloco Comercial",
                    "city": "Comercial", "zipcode": "02003-500",
                    "geo": {"lat": "74.1", "lng": "145.6"}},
        "phone": "11-99005-0018", "website": "fernandalima.sales",
        "company": {"name": "Comercial e Vendas",
                    "catchPhrase": "CRM especialista", "bs": "convert leads to clients"}
    },
    {
        "id": 19, "name": "Diego Martins", "username": "diegomartins",
        "email": "diego.martins@vendas.io",
        "address": {"street": "Mesa 4-Com", "suite": "Bloco Comercial",
                    "city": "Comercial", "zipcode": "02003-500",
                    "geo": {"lat": "77.8", "lng": "144.3"}},
        "phone": "11-99005-0019", "website": "diegomartins.io",
        "company": {"name": "Comercial e Vendas",
                    "catchPhrase": "Vendas consultivas", "bs": "drive B2B revenue"}
    },

    # ── Operações — Andar 3, lat≈145, lng≈75 ─────────────────────────────────
    {
        "id": 20, "name": "Chelsey Barbosa", "username": "chelseybarbosa",
        "email": "chelsey.barbosa@vendas.io",
        "address": {"street": "Mesa 1-Ops", "suite": "Bloco Operações",
                    "city": "Operações", "zipcode": "03001-600",
                    "geo": {"lat": "143.3", "lng": "73.4"}},
        "phone": "11-99006-0020", "website": "chelseybarbosa.ops",
        "company": {"name": "Operações & Logística",
                    "catchPhrase": "Eficiência máxima", "bs": "optimize supply chain"}
    },
    {
        "id": 21, "name": "Ervin Howell", "username": "ervinhowell",
        "email": "ervin.howell@vendas.io",
        "address": {"street": "Mesa 2-Ops", "suite": "Bloco Operações",
                    "city": "Operações", "zipcode": "03001-600",
                    "geo": {"lat": "147.1", "lng": "77.2"}},
        "phone": "11-99006-0021", "website": "ervinhowell.net",
        "company": {"name": "Operações & Logística",
                    "catchPhrase": "Processos ágeis", "bs": "lean manufacturing"}
    },
    {
        "id": 22, "name": "Luciana Nascimento", "username": "luciananascimento",
        "email": "luciana.nascimento@vendas.io",
        "address": {"street": "Mesa 3-Ops", "suite": "Bloco Operações",
                    "city": "Operações", "zipcode": "03001-600",
                    "geo": {"lat": "145.6", "lng": "75.8"}},
        "phone": "11-99006-0022", "website": "luciananascimento.com",
        "company": {"name": "Operações & Logística",
                    "catchPhrase": "KPIs no verde", "bs": "monitor operational metrics"}
    },

    # ── Jurídico — Andar 3, lat≈145, lng≈5 ───────────────────────────────────
    {
        "id": 23, "name": "Yuki Tanaka", "username": "yukitanaka",
        "email": "yuki.tanaka@juridico.com",
        "address": {"street": "Sala Jurídica A", "suite": "Bloco Jur",
                    "city": "Jurídico", "zipcode": "03002-700",
                    "geo": {"lat": "143.5", "lng": "3.2"}},
        "phone": "11-99007-0023", "website": "yukitanaka.law",
        "company": {"name": "Jurídico & Compliance",
                    "catchPhrase": "Contratos sólidos", "bs": "minimize legal risk"}
    },
    {
        "id": 24, "name": "Marcus Tanner", "username": "marcustanner",
        "email": "marcus.tanner@juridico.com",
        "address": {"street": "Sala Jurídica B", "suite": "Bloco Jur",
                    "city": "Jurídico", "zipcode": "03002-700",
                    "geo": {"lat": "147.2", "lng": "6.8"}},
        "phone": "11-99007-0024", "website": "marcustanner.law",
        "company": {"name": "Jurídico & Compliance",
                    "catchPhrase": "Compliance total", "bs": "enforce regulatory standards"}
    },
    {
        "id": 25, "name": "Ana Paula Gomes", "username": "anapaulagomes",
        "email": "ana.gomes@juridico.com",
        "address": {"street": "Sala Jurídica C", "suite": "Bloco Jur",
                    "city": "Jurídico", "zipcode": "03002-700",
                    "geo": {"lat": "145.1", "lng": "5.4"}},
        "phone": "11-99007-0025", "website": "anapaulagomes.adv",
        "company": {"name": "Jurídico & Compliance",
                    "catchPhrase": "Direito empresarial", "bs": "protect intellectual property"}
    },
]
