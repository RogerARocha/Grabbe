# **Product Requirements Document (PRD) — Grabbe**

**Versão:** 1.2 (Desktop-First / Local-First / Enterprise Ready)

**Status:** Em Planejamento

**Público-Alvo da Documentação:** Engenharia, Produto e Design

## **1\. Visão Executiva**

O **Grabbe** é uma aplicação desktop de tracking e ranking projetada para ser o ecossistema definitivo de organização de mídias de entretenimento (Jogos, Animes, Mangás, Livros, Quadrinhos, Filmes e Séries).

Construído sob o paradigma **Local-First**, o Grabbe garante que o usuário tenha posse total de seus dados, operando de forma autossuficiente e offline por padrão. O aplicativo entrega uma experiência de altíssimo desempenho, eliminando tempos de carregamento e dependência de conectividade constante, utilizando a nuvem apenas como ferramenta de busca de metadados e, no futuro, para sincronização opcional.

## **2\. Escopo e Princípios do Produto**

* **Desktop-First:** Foco inicial em sistemas operacionais desktop (Windows, macOS, Linux) para garantir uma interface rica, navegação em atalhos e máxima performance.  
* **Local-First & Offline por Design:** O banco de dados primário reside na máquina do usuário. Funcionalidades de leitura, escrita, ranking e estatísticas não dependem de internet.  
* **Agnóstico de Plataforma de Mídia:** Um tracker universal. O usuário não precisa de 5 aplicativos diferentes para registrar o que consome.  
* **Minimalismo Funcional:** Interface sem poluição visual, focada na arte da mídia (capas) e na eficiência do registro de dados.

## **3\. Arquitetura Técnica Detalhada**

A arquitetura é dividida em dois domínios principais: a **Aplicação Cliente (Desktop)** e o **Serviço de Apoio (BFF na Nuvem)**.

### **3.1. Stack Tecnológico Recomendado**

* **Frontend (Desktop):** Tauri (Core em Rust, Interface em React/TypeScript ou Vue). O Tauri oferece um binário muito menor e consumo de RAM drasticamente inferior ao Electron, essencial para um app que roda em background.  
* **Banco de Dados Local:** SQLite via Prisma ORM ou Drizzle (integrado ao frontend) ou via abstração no core em Rust.  
* **BFF (Backend for Frontend):** C\# (.NET Core) devido à sua excelente performance na manipulação de concorrência e chamadas assíncronas múltiplas para APIs externas.  
* **Cache do BFF:** Redis (para armazenar respostas das APIs externas e evitar rate-limiting).

### **3.2. Diagrama de Arquitetura**

Snippet de código

graph TD

    subgraph Desktop Client \[Grabbe Desktop App \- Local First\]

        UI\[Interface UI \- React/Vue\]

        Core\[Tauri Core \- Rust\]

        DB\[(SQLite Local)\]

        

        UI \<--\>|Comandos / Eventos| Core

        Core \<--\>|Queries Rápidas / Offline| DB

    end

    subgraph Nuvem \[Grabbe Cloud Services\]

        BFF\[BFF \- API Aggregator\]

        Redis\[(Redis Cache)\]

        Sync\[Sync Engine \- Fase 3\]

    end

    subgraph APIs Externas \[Provedores de Metadados\]

        TMDB\[TMDB API \- Filmes/Séries\]

        IGDB\[IGDB API \- Jogos\]

        Jikan\[Jikan API \- Animes/Mangás\]

        GBooks\[Google Books API\]

        ComicVine\[ComicVine API\]

    end

    Core \<--\>|REST / JSON \- Busca de Mídia| BFF

    BFF \<--\>|Verifica / Salva Cache| Redis

    BFF \--\>|Fetch Normalizado| TMDB

    BFF \--\>|Fetch Normalizado| IGDB

    BFF \--\>|Fetch Normalizado| Jikan

    BFF \--\>|Fetch Normalizado| GBooks

    BFF \--\>|Fetch Normalizado| ComicVine

## **4\. Design do BFF (Backend for Frontend) Agregador**

O BFF atua como um escudo entre o Grabbe Desktop e as APIs de terceiros. O cliente desktop **nunca** faz requisições diretas ao TMDB ou Jikan.

### **4.1. Responsabilidades do BFF**

1. **Normalização de Contrato:** Independentemente de a origem ser o Jikan ou o TMDB, o BFF retorna um objeto unificado (padrão GrabbeMediaObject). O frontend não precisa saber lidar com 5 estruturas JSON diferentes.  
2. **Proteção de Rate Limit:** APIs como IGDB e Jikan têm limites estritos. O BFF enfileira e gerencia essas chamadas.  
3. **Caching Agressivo (Redis):** Se o usuário busca "Breaking Bad", o BFF consulta o TMDB, formata os dados e salva no Redis com um TTL (Time to Live) de 7 a 15 dias. A próxima busca global por "Breaking Bad" bate apenas no Redis, com resposta em milissegundos.

### **4.2. Endpoints Principais**

* GET /api/v1/search?query={texto}\&type={mediaType}  
  * *Ação:* Roteia a busca para a API correspondente com base no tipo, normaliza e retorna a lista.  
* GET /api/v1/media/{sourceApi}/{type}/{externalId}  
  * *Ação:* Busca os metadados profundos (descrição completa, elenco, desenvolvedora) de um item específico.  
* GET /api/v1/trending?type={mediaType}  
  * *Ação:* Retorna os itens em alta (alimenta a aba "Descobrir").

## **5\. Estrutura Ideal do Database Schema (SQLite Local)**

O modelo relacional abaixo garante a integridade do histórico do usuário e suporta o sistema de rankings e logs de consumo.

SQL

\-- TABELA: Media (Armazena o cache local das mídias para funcionamento offline)

CREATE TABLE Media (

    id TEXT PRIMARY KEY, \-- UUID gerado localmente

    external\_id TEXT NOT NULL, \-- ID da API original (ex: TMDB id)

    source\_api TEXT NOT NULL, \-- 'TMDB', 'JIKAN', 'IGDB', etc.

    type TEXT NOT NULL, \-- 'MOVIE', 'GAME', 'ANIME', etc.

    title TEXT NOT NULL,

    description TEXT,

    cover\_image\_path TEXT, \-- Caminho local salvo no media\_cache ou URL

    release\_date DATE,

    franchise TEXT,

    genres TEXT, \-- JSON ou string separada por vírgulas

    created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP

);

\-- TABELA: UserTracking (O estado atual e global do usuário em relação à mídia)

CREATE TABLE UserTracking (

    id TEXT PRIMARY KEY,

    media\_id TEXT NOT NULL,

    status TEXT NOT NULL, \-- 'PLANNED', 'CONSUMING', 'PAUSED', 'DROPPED', 'COMPLETED'

    progress INTEGER DEFAULT 0, \-- Episódio atual, horas jogadas, ou % de leitura

    total\_progress INTEGER, \-- Total de episódios/capítulos (copiado da Media)

    rewatch\_count INTEGER DEFAULT 0, \-- Incrementado automaticamente a cada nova sessão concluída

    notes TEXT, \-- Mantido da versão anterior para anotações gerais

    updated\_at DATETIME DEFAULT CURRENT\_TIMESTAMP,

    FOREIGN KEY (media\_id) REFERENCES Media(id)

);

\-- TABELA: ConsumptionSession (Registra cada vez que a mídia é consumida/rejogada)

CREATE TABLE ConsumptionSession (

    id TEXT PRIMARY KEY,

    tracking\_id TEXT NOT NULL,

    session\_number INTEGER DEFAULT 1, \-- 1 \= Primeira vez, 2 \= Primeiro Replay, etc.

    start\_date DATETIME,

    finish\_date DATETIME,

    is\_active BOOLEAN DEFAULT TRUE, \-- Identifica se é a sessão que está rodando no momento

    created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP,

    FOREIGN KEY (tracking\_id) REFERENCES UserTracking(id)

);

\-- TABELA: TrackingHistory (Registro imutável para a "Timeline de consumo")

CREATE TABLE TrackingHistory (

    id TEXT PRIMARY KEY,

    tracking\_id TEXT NOT NULL,

    event\_type TEXT NOT NULL, \-- 'STATUS\_CHANGE', 'PROGRESS\_UPDATE', 'SESSION\_START'

    previous\_value TEXT,

    new\_value TEXT,

    event\_date DATETIME DEFAULT CURRENT\_TIMESTAMP,

    FOREIGN KEY (tracking\_id) REFERENCES UserTracking(id)

);

\-- TABELA: Ranking (Avaliações do usuário \- 1:1 com a Media)

CREATE TABLE Ranking (

    id TEXT PRIMARY KEY,

    media\_id TEXT NOT NULL UNIQUE, \-- O UNIQUE garante que a nota seja sempre sobrescrita

    score INTEGER CHECK (score \>= 1 AND score \<= 10),

    review\_text TEXT,

    created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP, \-- Mantido da versão anterior

    updated\_at DATETIME DEFAULT CURRENT\_TIMESTAMP,

    FOREIGN KEY (media\_id) REFERENCES Media(id)

);

## **6\. Funcionalidades Detalhadas (Core)**

### **6.1. Motor de Tracking**

* **Lógica de Progressão:** O app deve adaptar o controle numérico. Exemplo: Para *Livros*, rastreia Páginas ou Porcentagem. Para *Séries*, Temporada/Episódio. Para *Jogos*, Horas jogadas ou Conquistas (manual).  
* **Transições Automáticas:** Se o usuário atualiza o episódio de 1 para 2, o status muda automaticamente de "Planejado" para "Consumindo". Se atinge o total de episódios, muda para "Concluído" e preenche a finish\_date.

### **6.2. Sistema de Ranking Pessoal**

O usuário terá uma visão global de suas avaliações.

* **Tier List Automática:** Com base nas notas de 1 a 10, o app pode gerar visualizações em formato Lista separando Filmes, Jogos e Animes no mesmo painel.

### **6.3. Gestão de Datas de Consumo (Timeline Control)**

* **Preenchimento Automático Inteligente:** Como facilitador, o sistema registrará automaticamente a start\_date no dia em que o status mudar para "Consumindo" e a finish\_date no dia em que mudar para "Concluído".  
* **Controle Manual (Sobrescrita):** O usuário terá total liberdade para editar essas datas através de um Date Picker na interface de tracking da mídia.  
* **Casos de Uso Suportados:**  
  * **Catalogação Retroativa (Backlogging):** Inserir mídias consumidas no passado (ex: o usuário quer registrar que terminou *The Witcher 3* em maio de 2018).  
  * **Correção de Esquecimento:** O usuário terminou um anime na sexta-feira, mas só abriu o Grabbe no domingo. Ele pode ajustar a data de conclusão para sexta.  
  * **Preparação para Importação (Fase 2):** Ao permitir edição de datas, a estrutura já fica pronta para receber dados importados do *MyAnimeList*, *Letterboxd* ou *Goodreads*, preservando o histórico original daquelas plataformas.

### **6.4. Sistema de Replay / Rewatch / Reread** 

O sistema deve suportar múltiplos ciclos de consumo para a mesma mídia, garantindo que o histórico de longo prazo seja preservado sem duplicar a mídia na biblioteca do usuário.

* **Histórico de Sessões (Ciclos de Consumo):** Cada vez que o usuário iniciar um "Replay", o sistema criará uma nova "Sessão de Consumo" atrelada àquela mídia. Cada sessão terá sua própria start\_date e finish\_date.  
* **Preservação de Dados:** O registro da primeira vez que o usuário consumiu a obra (e de todos os replays anteriores) ficará salvo permanentemente na aba de "Histórico" da mídia.  
* **Sobrescrita de Avaliação (Rating & Review):** A nota (1 a 10\) e a review escrita em texto são singulares por mídia. Ao reavaliar uma obra após um replay, a nota e o texto anteriores são **sobrescritos**. O sistema assume que a avaliação reflete a percepção mais atual e madura do usuário sobre o conteúdo.

## **7\. Contratos de Comunicação (BFF ↔ Frontend Desktop)**

O BFF (Backend for Frontend) atua como um agregador e normalizador. Todo retorno do BFF para o desktop deve seguir um formato padronizado (GrabbeMediaDTO), independentemente da fonte original (TMDB, IGDB, etc.).

### **7.1. Padrão de Objeto Unificado (GrabbeMediaDTO)**

Este é o objeto base que o desktop receberá e salvará em sua tabela local Media.

JSON

{

  "externalId": "string",       // ID original da API (ex: "tt0903747" ou "11004")

  "sourceApi": "string",        // "TMDB", "JIKAN", "IGDB", "GBOOKS", "COMICVINE"

  "type": "string",             // "MOVIE", "SERIES", "ANIME", "MANGA", "GAME", "BOOK", "COMIC"

  "title": "string",

  "description": "string",      // Pode ser nulo em buscas em lote para economizar banda

  "coverImageUrl": "string",    // URL da capa fornecida pela API externa

  "releaseDate": "string",      // Formato ISO 8601 (YYYY-MM-DD)

  "franchise": "string",        // Nome da franquia ou saga, se aplicável (nullable)

  "genres": \["string"\],         // Array de strings com os gêneros

  "totalProgress": "number"     // Quantidade total de episódios/capítulos/páginas (nullable para filmes/jogos)

}

### **7.2. Endpoint: Busca Global de Mídias**

Responsável por buscar mídias a partir da barra de pesquisa do aplicativo. O BFF recebe a requisição, roteia para a API correta com base no type e normaliza a resposta.

* **Rota:** GET /api/v1/search  
* **Query Params:**  
  * query (string, required): O texto da busca.  
  * type (string, required): O tipo de mídia desejado.  
  * page (number, optional): Paginação (default: 1).

**Exemplo de Resposta (Status 200 OK):**

JSON

{

  "data": \[

    {

      "externalId": "tt0903747",

      "sourceApi": "TMDB",

      "type": "SERIES",

      "title": "Breaking Bad",

      "description": "Um professor de química do ensino médio diagnosticado com câncer de pulmão...",

      "coverImageUrl": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGj9.jpg",

      "releaseDate": "2008-01-20",

      "franchise": "Breaking Bad Universe",

      "genres": \["Drama", "Crime"\],

      "totalProgress": 62

    },

    {

      "externalId": "tt9018736",

      "sourceApi": "TMDB",

      "type": "MOVIE",

      "title": "El Camino: A Breaking Bad Movie",

      "description": "O fugitivo Jesse Pinkman foge de seus captores, da lei e de seu passado.",

      "coverImageUrl": "https://image.tmdb.org/t/p/w500/e0fP21G2i1Q9mHlP62Q8f8r1H6p.jpg",

      "releaseDate": "2019-10-11",

      "franchise": "Breaking Bad Universe",

      "genres": \["Crime", "Drama", "Thriller"\],

      "totalProgress": 1

    }

  \],

  "meta": {

    "currentPage": 1,

    "totalPages": 3,

    "totalResults": 45,

    "sourceRateLimitRemaining": 38 // Opcional: útil para monitoramento do BFF

  }

}

### **7.3. Endpoint: Detalhes Profundos da Mídia**

Usado quando o usuário clica em um item específico para ver a página de detalhes antes de adicioná-lo à biblioteca. Pode trazer dados extras que não vêm na busca em lote.

* **Rota:** GET /api/v1/media/{sourceApi}/{type}/{externalId}  
* **Path Params:**  
  * sourceApi (string, required): Provedor de origem (ex: TMDB, JIKAN).
  * type (string, required): Tipo de mídia (ex: MOVIE, ANIME).
  * externalId (string, required): ID da mídia na API externa.
**Exemplo de Resposta (Status 200 OK):**

JSON

{

  "data": {

    "externalId": "11004",

    "sourceApi": "JIKAN",

    "type": "ANIME",

    "title": "Hunter x Hunter (2011)",

    "description": "Gon Freecss sonha em se tornar um Hunter para encontrar seu pai...",

    "coverImageUrl": "https://cdn.myanimelist.net/images/anime/1337/99013l.jpg",

    "releaseDate": "2011-10-02",

    "franchise": "Hunter x Hunter",

    "genres": \["Action", "Adventure", "Fantasy"\],

    "totalProgress": 148,

    "extraMetadata": {

      "studios": \["Madhouse"\],

      "status": "Finished Airing"

    }

  }

}

### **7.4. Tratamento de Erros Padronizado**

Se houver falha na API externa ou o rate limit for estourado de forma irreversível (mesmo com as filas do BFF), o front-end receberá este formato:

**Exemplo de Resposta (Status 429 Too Many Requests ou 502 Bad Gateway):**

JSON

{

  "error": {

    "code": "EXTERNAL\_API\_RATE\_LIMIT",

    "message": "A API de origem (JIKAN) está limitando as requisições no momento. O cache local não possui essa informação. Tente novamente em alguns segundos.",

    "sourceApi": "JIKAN"

  }

}

## **8\. Motor de Retenção, Identidade e Shareability**

Para transformar o ato de registrar mídias em um hábito engajador, o Grabbe incorpora conceitos de "show-off" (exibição) e identidade cultural. O usuário rastreia para ter controle, mas visualiza para entender a si mesmo e compartilhar com seus amigos.

Toda a geração de dados visuais é feita primariamente de forma **Local-First**, utilizando o poder de processamento do desktop do usuário para cruzar os dados do SQLite e renderizar imagens exportáveis.

### **8.1. Grabbe Recap (O "Wrapped" do Entretenimento)**

Relatórios visuais gerados automaticamente, criados para serem exportados e compartilhados em redes sociais.

* **Frequência:** Mensal (Micro-Recaps) e Anual (O Grande Recap).  
* **Formato de Exportação:** Renderização em formato "Story" (9:16) ou formato paisagem nativo da aplicação, gerando um .png em um clique.  
* **Insights Gerados pelo Banco Local:**  
  * **Tempo Investido:** *"Você foi sugado: passou 120 horas minerando e construindo no Minecraft este mês."*  
  * **Eclético ou Focado:** *"Sua Trindade de Março:"* (As 3 mídias concluídas com maiores notas, misturando animes, livros e jogos na mesma tela).  
  * **Hábitos:** *"Maratoneiro: Você leu 3 volumes de mangá e assistiu a 10 episódios em um único final de semana."*

### **8.2. Cartão de Perfil Unificado (Identidade Geek/Nerd)**

Uma interface que atua como a "Steam" ou "Letterboxd" definitiva do usuário, combinando todos os ecossistemas em uma única identidade visual.

* **Hall da Fama (Mosaico):** O usuário pode "pinar" (fixar) de 4 a 5 obras favoritas de todos os tempos no topo do perfil, não importando o tipo de mídia.  
* **Estatísticas Globais:**  
  * Contador total de mídias concluídas na vida.  
  * Gráfico de radar ou rosca com a distribuição de consumo (ex: 45% Jogos, 30% Séries, 25% Livros).  
  * Dias e horas totais de vida investidos em entretenimento.  
* **Exportação Rápida:** Geração de um "Banner de Perfil" (formato horizontal) contendo esse resumo, ideal para cabeçalhos de redes sociais ou para enviar em comunidades.

### **8.3. Dashboard Analítico Profundo (Visão Obsidian)**

Voltado para os usuários que gostam de cruzar dados e descobrir padrões no próprio comportamento.

* **Conexões de Nicho:** O sistema agrupa tags e metadados para mostrar padrões. Exemplo: identificar que o usuário tende a dar notas maiores para jogos de *Audio Processing* ou de estúdios específicos.  
* **Dispersão e Viés:** Gráficos que cruzam a "Nota Atribuída" com a "Data de Lançamento da Obra" ou com o "Gênero", revelando preferências subconscientes (ex: preferência esmagadora por RPGs da década de 90).

## **9\. Roadmap de Produto e Entregas**

### **Fase 1: MVP (Produto Mínimo Viável) \- Foco em Retenção Local**

* \[ \] Setup da arquitetura Desktop (Tauri) \+ SQLite.  
* \[ \] Implementação do BFF para 3 provedores iniciais (TMDB, Jikan, IGDB).  
* \[ \] Operações CRUD (Create, Read, Update, Delete) no rastreamento local.  
* \[ \] Interface Principal (Sidebar \+ Grid de Capas).  
* \[ \] Sistema de Ranking Básico (1 a 10).

### **Fase 2: Identidade, Engajamento e Estatísticas (Geração de Valor Offline)**

* \[ \] **Cartão de Perfil Unificado:** Implementação da interface de identidade (Hall da Fama e estatísticas globais) com geração de "Banner de Perfil" exportável.  
* \[ \] **Grabbe Recap:** Sistema de relatórios mensais e anuais exportáveis em formato "Story" (9:16).  
* \[ \] **Dashboard Analítico Profundo:** Implementação de gráficos avançados (conexões de nicho, tempo investido, dispersão e viés).  
* \[ \] Timeline de Consumo: Um feed estilo "rede social" pessoal mostrando o que o usuário fez dia a dia (alimentado pela tabela TrackingHistory).  
* \[ \] Integração com Google Books e ComicVine no BFF.  
* \[ \] Exportação/Importação de dados (arquivos .json ou .csv para backup manual).

### **Fase 3: Cloud e Ecossistema (Monetização / Escalabilidade)**

* \[ \] Sync Engine: Sincronização em nuvem via Event Sourcing baseada nas atualizações locais.  
* \[ \] Apps mobile (iOS/Android) consumindo o mesmo banco de dados via Sync.  
* \[ \] **Perfis Públicos na Web:** Evolução do "Cartão de Perfil" local para links públicos compartilháveis (ex: grabbe.app/u/usuario) gerados a partir do sync da nuvem.

