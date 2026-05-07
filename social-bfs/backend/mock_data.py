"""
Dados mock que replicam exatamente a estrutura de https://jsonplaceholder.typicode.com/users
15 usuários com dados diversificados: cidades, empresas, e-mails, CEPs e coordenadas variados.
"""

MOCK_USERS = [
    {
        "id": 1,
        "name": "Leanne Graham",
        "username": "Bret",
        "email": "Sincere@april.biz",
        "address": {
            "street": "Kulas Light",
            "suite": "Apt. 556",
            "city": "Gwenborough",
            "zipcode": "92998-3874",
            "geo": {"lat": "-37.3159", "lng": "81.1496"}
        },
        "phone": "1-770-736-8031 x56442",
        "website": "hildegard.org",
        "company": {"name": "Romaguera-Crona", "catchPhrase": "Multi-layered client-server neural-net", "bs": "harness real-time e-markets"}
    },
    {
        "id": 2,
        "name": "Ervin Howell",
        "username": "Antonette",
        "email": "Shanna@melissa.tv",
        "address": {
            "street": "Victor Plains",
            "suite": "Suite 879",
            "city": "Wisokyburgh",
            "zipcode": "90566-7771",
            "geo": {"lat": "-43.9509", "lng": "-34.4618"}
        },
        "phone": "010-692-6593 x09125",
        "website": "anastasia.net",
        "company": {"name": "Deckow-Crist", "catchPhrase": "Proactive didactic contingency", "bs": "synergize scalable supply-chains"}
    },
    {
        "id": 3,
        "name": "Clementine Bauch",
        "username": "Samantha",
        "email": "Nathan@yesenia.net",
        "address": {
            "street": "Douglas Extension",
            "suite": "Suite 847",
            "city": "McKenziehaven",
            "zipcode": "59590-4157",
            "geo": {"lat": "-68.6102", "lng": "-47.0653"}
        },
        "phone": "1-463-123-4447",
        "website": "ramiro.info",
        "company": {"name": "Romaguera-Jacobson", "catchPhrase": "Face to face bifurcated interface", "bs": "e-enable strategic applications"}
    },
    {
        "id": 4,
        "name": "Patricia Lebsack",
        "username": "Karianne",
        "email": "Julianne.OConner@kory.org",
        "address": {
            "street": "Hoeger Mall",
            "suite": "Apt. 692",
            "city": "South Elvis",
            "zipcode": "53919-4257",
            "geo": {"lat": "29.4572", "lng": "-164.2990"}
        },
        "phone": "493-170-9623 x156",
        "website": "kale.biz",
        "company": {"name": "Robel-Corkery", "catchPhrase": "Multi-tiered zero tolerance productivity", "bs": "transition cutting-edge web services"}
    },
    {
        "id": 5,
        "name": "Chelsey Dietrich",
        "username": "Kamren",
        "email": "Lucio_Hettinger@annie.ca",
        "address": {
            "street": "Skiles Walks",
            "suite": "Suite 351",
            "city": "Roscoeview",
            "zipcode": "33263-8891",
            "geo": {"lat": "-31.8129", "lng": "62.5342"}
        },
        "phone": "(254)954-1289",
        "website": "demarco.info",
        "company": {"name": "Keebler LLC", "catchPhrase": "User-centric fault-tolerant solution", "bs": "revolutionize end-to-end systems"}
    },
    {
        "id": 6,
        "name": "Dennis Schulist",
        "username": "Leopoldo_Corkery",
        "email": "Karley_Dach@jasper.info",
        "address": {
            "street": "Norberto Crossing",
            "suite": "Apt. 950",
            "city": "South Christy",
            "zipcode": "23505-1337",
            "geo": {"lat": "-71.4197", "lng": "71.7478"}
        },
        "phone": "1-477-935-8478 x6430",
        "website": "ola.org",
        "company": {"name": "Considine-Lockman", "catchPhrase": "Synchronised bottom-line interface", "bs": "e-enable innovative applications"}
    },
    {
        "id": 7,
        "name": "Kurtis Weissnat",
        "username": "Elwyn.Skiles",
        "email": "Telly.Hoeger@billy.biz",
        "address": {
            "street": "Rex Trail",
            "suite": "Suite 280",
            "city": "Howemouth",
            "zipcode": "58804-1099",
            "geo": {"lat": "24.8918", "lng": "21.8984"}
        },
        "phone": "210.067.6132",
        "website": "elvis.io",
        "company": {"name": "Johns Group", "catchPhrase": "Configurable multimedia task-force", "bs": "generate enterprise e-tailers"}
    },
    {
        "id": 8,
        "name": "Nicholas Runolfsdottir",
        "username": "Maxime_Nienow",
        "email": "Sherwood@rosamond.me",
        "address": {
            "street": "Ellsworth Summit",
            "suite": "Suite 729",
            "city": "Aliyaview",
            "zipcode": "45169-3895",
            "geo": {"lat": "-14.3990", "lng": "-120.7677"}
        },
        "phone": "586.493.6943 x140",
        "website": "jacynthe.com",
        "company": {"name": "Abernathy Group", "catchPhrase": "Implemented secondary concept", "bs": "e-enable extensible e-tailers"}
    },
    {
        "id": 9,
        "name": "Glenna Reichert",
        "username": "Delphine",
        "email": "Chaim_McDermott@dana.io",
        "address": {
            "street": "Dayna Park",
            "suite": "Suite 449",
            "city": "Bartholomebury",
            "zipcode": "76495-3109",
            "geo": {"lat": "24.6463", "lng": "-168.8889"}
        },
        "phone": "(775)976-6794 x41206",
        "website": "conrad.com",
        "company": {"name": "Yost and Sons", "catchPhrase": "Switchable contextually-based project", "bs": "aggregate real-time technologies"}
    },
    {
        "id": 10,
        "name": "Clementina DuBuque",
        "username": "Moriah.Stanton",
        "email": "Rey.Padberg@karina.biz",
        "address": {
            "street": "Kattie Turnpike",
            "suite": "Suite 198",
            "city": "Lebsackbury",
            "zipcode": "31428-2261",
            "geo": {"lat": "-38.2386", "lng": "57.2232"}
        },
        "phone": "024-648-3804",
        "website": "ambrose.net",
        "company": {"name": "Hoeger LLC", "catchPhrase": "Centralized empowering task-force", "bs": "target end-to-end models"}
    },
    {
        "id": 11,
        "name": "Marcus Tanner",
        "username": "mtanner",
        "email": "marcus.tanner@april.biz",
        "address": {
            "street": "Sunrise Boulevard",
            "suite": "Unit 12",
            "city": "Gwenborough",
            "zipcode": "92001-5543",
            "geo": {"lat": "-36.8800", "lng": "80.9100"}
        },
        "phone": "1-555-820-3341",
        "website": "mtanner.dev",
        "company": {"name": "Romaguera-Crona", "catchPhrase": "Integrated holistic synergy", "bs": "leverage agile frameworks"}
    },
    {
        "id": 12,
        "name": "Sofia Pereira",
        "username": "sofip",
        "email": "sofia@techwave.io",
        "address": {
            "street": "Rua das Flores",
            "suite": "Ap. 301",
            "city": "Porto Alegre",
            "zipcode": "90010-1200",
            "geo": {"lat": "-30.0346", "lng": "-51.2177"}
        },
        "phone": "+55-51-99999-0012",
        "website": "sofipereira.dev",
        "company": {"name": "TechWave Solutions", "catchPhrase": "Disrupting the digital frontier", "bs": "scale cloud-native pipelines"}
    },
    {
        "id": 13,
        "name": "Amir Khoury",
        "username": "amir_k",
        "email": "amir.khoury@techwave.io",
        "address": {
            "street": "Al Rashid Street",
            "suite": "Office 5B",
            "city": "Dubai",
            "zipcode": "90015-4421",
            "geo": {"lat": "25.2048", "lng": "55.2708"}
        },
        "phone": "+971-50-555-0013",
        "website": "amirkhoury.ae",
        "company": {"name": "TechWave Solutions", "catchPhrase": "Disrupting the digital frontier", "bs": "scale cloud-native pipelines"}
    },
    {
        "id": 14,
        "name": "Yuki Tanaka",
        "username": "yukitanaka",
        "email": "yuki@dana.io",
        "address": {
            "street": "Shibuya Crossing",
            "suite": "Floor 8",
            "city": "Tokyo",
            "zipcode": "76400-8801",
            "geo": {"lat": "35.6762", "lng": "139.6503"}
        },
        "phone": "+81-3-5555-0014",
        "website": "yukitanaka.jp",
        "company": {"name": "Nexon Digital", "catchPhrase": "Pixel-perfect performance", "bs": "orchestrate immersive experiences"}
    },
    {
        "id": 15,
        "name": "Bianca Ferreira",
        "username": "biancaf",
        "email": "bianca.ferreira@kory.org",
        "address": {
            "street": "Avenida Paulista",
            "suite": "Conj. 74",
            "city": "São Paulo",
            "zipcode": "53900-0055",
            "geo": {"lat": "-23.5614", "lng": "-46.6560"}
        },
        "phone": "+55-11-98888-0015",
        "website": "biancaferreira.com.br",
        "company": {"name": "Robel-Corkery", "catchPhrase": "Multi-tiered zero tolerance productivity", "bs": "transition cutting-edge web services"}
    }
]
