# **Architecture Context & PRD — Grabbe**

*(Para a versão em Português, role para baixo / For Portuguese version, scroll down)*

**Version:** 1.3 (Desktop-First / Local-First / Enterprise Ready)

**Status:** In Planning

**Target Audience:** Engineering, Product, and Design

## **1. Executive Vision**

**Grabbe** is a desktop tracking and ranking application designed to be the ultimate ecosystem for organizing entertainment media (Games, Anime, Manga, Books, Comics, Movies, and Series).

Built under the **Local-First** paradigm, Grabbe ensures the user has full ownership of their data, operating self-sufficiently and offline by default. The application delivers a high-performance experience, eliminating load times and reliance on constant connectivity, using the cloud only as a metadata search tool and, in the future, for optional synchronization.

## **2. Product Scope and Principles**

* **Desktop-First:** Initial focus on desktop operating systems (Windows, macOS, Linux) to ensure a rich interface, shortcut navigation, and maximum performance.
* **Local-First & Offline by Design:** The primary database resides on the user's machine. Reading, writing, ranking, and statistics features do not depend on the internet.
* **Media Platform Agnostic:** A universal tracker. The user doesn't need 5 different applications to log what they consume.
* **Functional Minimalism:** A clutter-free interface, focusing on media art (covers) and efficient data entry.

## **3. Detailed Technical Architecture**

The architecture is divided into two main domains: the **Client Application (Desktop)** and the **Supporting Service (BFF in the Cloud)**.

### **3.1. Recommended Tech Stack**

* **Frontend (Desktop):** Tauri (Core in Rust, Interface in React/TypeScript or Vue). Tauri offers a much smaller binary and drastically lower RAM consumption compared to Electron, essential for an app that runs in the background.
* **Local Database:** SQLite via Prisma ORM or Drizzle (integrated into the frontend) or via abstraction in the Rust core.
* **BFF (Backend for Frontend):** C# (.NET 9.0+) due to its excellent performance in handling concurrency and multiple asynchronous calls to external APIs.
* **BFF Cache:** Redis or IMemoryCache (to store responses from external APIs and avoid rate-limiting).

### **3.2. Architecture Diagram**

```mermaid
graph TD
    subgraph Desktop Client [Grabbe Desktop App - Local First]
        UI[UI Interface - React/Vue]
        Core[Tauri Core - Rust]
        DB[(Local SQLite)]
        
        UI <-->|Commands / Events| Core
        Core <-->|Fast Queries / Offline| DB
    end

    subgraph Cloud [Grabbe Cloud Services]
        BFF[BFF - API Aggregator]
        Redis[(Redis Cache)]
        Sync[Sync Engine - Phase 3]
    end

    subgraph External APIs [Metadata Providers]
        TMDB[TMDB API - Movies/Series]
        IGDB[IGDB API - Games]
        Jikan[Jikan API - Anime/Manga]
        GBooks[Google Books API]
        ComicVine[ComicVine API]
    end

    Core <-->|REST / JSON - Media Search| BFF
    BFF <-->|Check / Save Cache| Redis
    BFF -->|Normalized Fetch| TMDB
    BFF -->|Normalized Fetch| IGDB
    BFF -->|Normalized Fetch| Jikan
    BFF -->|Normalized Fetch| GBooks
    BFF -->|Normalized Fetch| ComicVine
```

## **4. BFF (Backend for Frontend) Aggregator Design**

The BFF acts as a shield between Grabbe Desktop and third-party APIs. The desktop client **never** makes direct requests to TMDB or Jikan.

### **4.1. Overview and Responsibilities**

Grabbe's Backend for Frontend (BFF) acts as an intermediary (Aggregator and Normalizer). It has three main responsibilities:

1. **Contract Unification / Normalization:** Whether the source is Jikan, TMDB, or GBooks, the BFF receives distinct JSONs from different APIs and transforms them into a single standard (`GrabbeMediaDTO`). The frontend doesn't need to handle different JSON structures.
2. **Rate Limit Protection and Management:** APIs like IGDB and Jikan have strict limits. The BFF queues or limits calls to avoid exceeding free tiers.
3. **Aggressive Caching (Redis/Memory):** Stores responses for repeated searches, reducing latency to milliseconds. Ex: If the user searches for "Breaking Bad", the BFF queries TMDB, formats it, and saves it with a TTL of 7 to 15 days. The next search will hit only the cache.

### **4.2. Project Structure and Environment Setup**

The project follows a structure based on separation of concerns by features (Vertical Slice Architecture). To ensure proper functioning and avoid IDE code versioning issues, the repository structure should be assembled as follows:

```plaintext
grabbe-bff/  
├── .gitignore               # Must ignore .env.local, .idea/ (if applicable), bin/, obj/  
├── .env.local               # Local file for API keys (MUST NOT be committed to the repository)  
├── Grabbe.BFF.sln           # Solution file (Must be committed)  
└── src/  
    └── Grabbe.API/  
        ├── Grabbe.API.csproj  # Project file (Must be committed)  
        ├── Program.cs  
        ├── appsettings.json  
        ├── Domain/  
        │   └── DTOs/  
        │       └── GrabbeMediaDTO.cs  
        ├── Features/  
        │   ├── MediaDetails/  
        │   │   ├── DetailsController.cs  
        │   │   └── DetailsService.cs  
        │   └── MediaSearch/  
        │       ├── SearchController.cs  
        │       └── SearchAggregationService.cs  
        └── Infrastructure/  
            ├── Cache/  
            ├── Configuration/  
            │   └── ExternalApiOptions.cs  
            └── ExternalClients/  
                ├── IMediaProviderClient.cs  
                ├── TMDB/  
                ├── Jikan/  
                └── GBooks/
```

**Development Setup:**
* The solution can be natively opened in Rider or Visual Studio, ensuring the `.sln` and `.csproj` files are properly tracked by Git.
* Sensitive keys (like TMDB and Google API Keys) must be isolated in the `.env.local` file at the project root.

### **4.3. Concurrency and Performance Patterns**

For global searches (when the user doesn't filter the media type and searches all sources simultaneously), the BFF must optimize response times by executing concurrent asynchronous calls.

The `MediaAggregationService` will use `Task.WhenAll` to fire requests to TMDB, Jikan, and GBooks at the same time, await all of them, flatten the lists, sort by relevance, and return the unified array to the frontend.

### **4.4. External Clients Specifications (Inputs)**

C# will map only the necessary fields from each external API to avoid memory overhead.

**A. TMDB Client (Movies and Series)**
* **Base Endpoint:** `https://api.themoviedb.org/3`
* **Authentication:** Header `Authorization: Bearer {TMDB_READ_ACCESS_TOKEN}` (Read from `.env.local`).
* **Mapping:**
  * `poster_path` -> `CoverImageUrl` (needs to concatenate with `https://image.tmdb.org/t/p/w500/`)
  * `overview` -> `Description`
  * If it's a series (TV), map `number_of_episodes` to `TotalProgress`.

**B. Jikan Client (Anime and Manga)**
* **Base Endpoint:** `https://api.jikan.moe/v4`
* **Authentication:** None (Open API).
* **Critical Restriction:** Limit of 3 requests per second. The `JikanClient` must implement a retry policy (e.g., Polly library with exponential backoff) to handle the 429 Too Many Requests status.
* **Mapping:**
  * `images.jpg.image_url` -> `CoverImageUrl`
  * `synopsis` -> `Description`
  * `episodes` (Anime) or `chapters` (Manga) -> `TotalProgress`

**C. Google Books Client (Books)**
* **Base Endpoint:** `https://www.googleapis.com/books/v1`
* **Authentication:** Query param `?key={GBOOKS_API_KEY}` (Read from `.env.local`).
* **Mapping (extracted from volumeInfo):**
  * `imageLinks.thumbnail` -> `CoverImageUrl`
  * `description` -> `Description`
  * `pageCount` -> `TotalProgress`
  * `authors` -> Mapped as meta-information, if necessary.

## **5. Ideal Database Schema Structure (Local SQLite)**

The relational model below ensures the integrity of the user's history and supports the ranking system and consumption logs in the Desktop client.

```sql
-- TABLE: Media (Stores the local cache of media for offline functioning)
CREATE TABLE Media (
    id TEXT PRIMARY KEY, -- Locally generated UUID
    external_id TEXT NOT NULL, -- Original API ID (e.g., TMDB id)
    source_api TEXT NOT NULL, -- 'TMDB', 'JIKAN', 'IGDB', etc.
    type TEXT NOT NULL, -- 'MOVIE', 'GAME', 'ANIME', etc.
    title TEXT NOT NULL,
    description TEXT,
    cover_image_path TEXT, -- Local path saved in media_cache or URL
    release_date DATE,
    franchise TEXT,
    genres TEXT, -- JSON or comma-separated string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: UserTracking (The user's current and global state regarding the media)
CREATE TABLE UserTracking (
    id TEXT PRIMARY KEY,
    media_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'PLANNED', 'CONSUMING', 'PAUSED', 'DROPPED', 'COMPLETED'
    progress INTEGER DEFAULT 0, -- Current episode, hours played, or read %
    total_progress INTEGER, -- Total episodes/chapters (copied from Media)
    rewatch_count INTEGER DEFAULT 0, -- Automatically incremented upon completing a new session
    notes TEXT, -- Kept from the previous version for general notes
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES Media(id)
);

-- TABLE: ConsumptionSession (Records every time the media is consumed/replayed)
CREATE TABLE ConsumptionSession (
    id TEXT PRIMARY KEY,
    tracking_id TEXT NOT NULL,
    session_number INTEGER DEFAULT 1, -- 1 = First time, 2 = First Replay, etc.
    start_date DATETIME,
    finish_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE, -- Identifies if it is the currently running session
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tracking_id) REFERENCES UserTracking(id)
);

-- TABLE: TrackingHistory (Immutable record for the "Consumption Timeline")
CREATE TABLE TrackingHistory (
    id TEXT PRIMARY KEY,
    tracking_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'STATUS_CHANGE', 'PROGRESS_UPDATE', 'SESSION_START'
    previous_value TEXT,
    new_value TEXT,
    event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tracking_id) REFERENCES UserTracking(id)
);

-- TABLE: Ranking (User's reviews - 1:1 with Media)
CREATE TABLE Ranking (
    id TEXT PRIMARY KEY,
    media_id TEXT NOT NULL UNIQUE, -- UNIQUE ensures the score is always overwritten
    score INTEGER CHECK (score >= 1 AND score <= 10),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Kept from previous version
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES Media(id)
);
```

## **6. Detailed Features (Core)**

### **6.1. Tracking Engine**

* **Progression Logic:** The app must adapt the numerical control. Example: For *Books*, track Pages or Percentage. For *Series*, Season/Episode. For *Games*, Hours played or Achievements (manual).
* **Automatic Transitions:** If the user updates the episode from 1 to 2, the status automatically changes from "Planned" to "Consuming". If it reaches the total episodes, it changes to "Completed" and fills `finish_date`.

### **6.2. Personal Ranking System**

The user will have a global view of their reviews.
* **Automatic Tier List:** Based on 1 to 10 scores, the app can generate List viewings separating Movies, Games, and Anime on the same panel.

### **6.3. Consumption Dates Management (Timeline Control)**

* **Intelligent Auto-fill:** The system will automatically log the `start_date` on the day the status changes to "Consuming" and the `finish_date` on the day it changes to "Completed".
* **Manual Control (Overwrite):** The user will have complete freedom to edit these dates via a Date Picker.
* **Supported Use Cases:**
  * **Retroactive Logging:** Entering media consumed in the past.
  * **Forgetfulness Correction:** Adjusting the completion date to past days.
  * **Import Preparation:** Structure ready to receive imported data (MyAnimeList, Letterboxd, etc).

### **6.4. Replay / Rewatch / Reread System**

* **Session History:** Each "Replay" will create a new "Consumption Session" tied to that media, with its own `start_date` and `finish_date`.
* **Data Preservation:** Previous replays will be saved in the media's "History".
* **Review Overwrite:** The score and text review are unique per media. When re-evaluating, previous data is overwritten, reflecting the user's most current view.

## **7. Communication Contracts and Endpoints (BFF ↔ Desktop)**

### **7.1. Unified Object Pattern (GrabbeMediaDTO)**

This is the schema the React/Tauri application will consume. C# guarantees it always outputs in this format, regardless of the original source.

**A. C# Class (BFF Output):**
```csharp
namespace Grabbe.API.Domain.DTOs;

public class GrabbeMediaDTO  
{  
    public required string ExternalId { get; set; }  
    public required string SourceApi { get; set; } // "TMDB", "JIKAN", "GBOOKS"  
    public required string Type { get; set; }      // "MOVIE", "SERIES", "ANIME", "MANGA", "BOOK"  
    public required string Title { get; set; }  
    public string? Description { get; set; }  
    public string? CoverImageUrl { get; set; }  
    public string? ReleaseDate { get; set; }       // ISO 8601 (YYYY-MM-DD)  
    public List<string> Genres { get; set; } = new();  
    public int? TotalProgress { get; set; }        // Total episodes or book pages  
}

public class PaginatedResponse<T>  
{  
    public required IEnumerable<T> Data { get; set; }  
    public int CurrentPage { get; set; }  
    public int TotalPages { get; set; }  
    public int TotalResults { get; set; }  
}
```

**B. JSON Response (Consumed by Frontend):**
```json
{
  "externalId": "string",
  "sourceApi": "string",
  "type": "string",
  "title": "string",
  "description": "string",
  "coverImageUrl": "string",
  "releaseDate": "string",
  "franchise": "string",
  "genres": ["string"],
  "totalProgress": 0
}
```

### **7.2. BFF Endpoints**

**1. Global Search (Concurrent)**
Responsible for searching media from the search bar. If no type is specified, it triggers all APIs via `Task.WhenAll` and merges the results.
* **Route:** `GET /api/v1/search?query={text}&type={MOVIE|ANIME|BOOK}&page=1`
* **Response Example:**
```json
{
  "data": [
    {
      "externalId": "tt0903747",
      "sourceApi": "TMDB",
      "type": "SERIES",
      "title": "Breaking Bad",
      "description": "A high school chemistry teacher...",
      "coverImageUrl": "https://image.tmdb.org/t/p/w500/...",
      "releaseDate": "2008-01-20",
      "genres": ["Drama", "Crime"],
      "totalProgress": 62
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 3,
    "totalResults": 45
  }
}
```

**2. Deep Media Details**
Fetches deep metadata of the work, bypassing batch search cache limits.
* **Route:** `GET /api/v1/media/{sourceApi}/{type}/{externalId}`
* **Example:** `/api/v1/media/JIKAN/ANIME/11004`
* **Response Example:**
```json
{
  "data": {
    "externalId": "11004",
    "sourceApi": "JIKAN",
    "type": "ANIME",
    "title": "Hunter x Hunter (2011)",
    "description": "Gon Freecss dreams of becoming a Hunter...",
    "coverImageUrl": "https://cdn.myanimelist.net/...",
    "releaseDate": "2011-10-02",
    "genres": ["Action", "Adventure"],
    "totalProgress": 148,
    "extraMetadata": {
      "studios": ["Madhouse"],
      "status": "Finished Airing"
    }
  }
}
```

**3. Trending (Hot Items)**
Feeds the "Discover" tab.
* **Route:** `GET /api/v1/trending?type={mediaType}`

### **7.3. Standardized Error Handling**

If there is an external API failure or the rate limit is exceeded, the frontend will receive this format:

```json
{
  "error": {
    "code": "EXTERNAL_API_RATE_LIMIT",
    "message": "The source API (JIKAN) is currently limiting requests. Please try again.",
    "sourceApi": "JIKAN"
  }
}
```

## **8. Retention, Identity, and Shareability Engine**

### **8.1. Grabbe Recap (Entertainment "Wrapped")**
* **Frequency:** Monthly and Yearly.
* **Export:** "Story" (9:16) or landscape format, generating a `.png` in one click.
* **Local Insights:** Time Invested, "Your Monthly Trinity", Binge Habits.

### **8.2. Unified Profile Card**
* **Hall of Fame:** Pin 4 to 5 favorite works at the top.
* **Statistics:** Completed media, consumption radar chart, hours of life invested.
* **Export:** Horizontal banner for social networks.

### **8.3. Deep Analytics Dashboard**
* **Niche Connections:** Taste patterns by studio/genre.
* **Dispersion and Bias:** Correlation between Given Score and Release Year.

## **9. Product Roadmap and Deliverables**

### **Phase 1: MVP - Focus on Local Retention**
* [ ] Desktop Architecture Setup (Tauri) + SQLite.
* [x] BFF Implementation for initial providers.
* [ ] CRUD operations on local tracking.
* [ ] Main Interface.
* [ ] Basic Ranking System (1 to 10).

### **Phase 2: Identity, Engagement, and Statistics**
* [ ] Unified Profile Card with exportable Banner.
* [ ] Grabbe Recap (Story Export).
* [ ] Analytics Dashboard.
* [ ] Consumption Timeline.
* [ ] Manual data Export/Import.

### **Phase 3: Cloud and Ecosystem**
* [ ] Sync Engine (Event Sourcing).
* [ ] Mobile apps (iOS/Android).
* [ ] Public Profiles on the Web (e.g., grabbe.app/u/user).

---

# **Architecture Context & PRD — Grabbe (Português)**

**Versão:** 1.3 (Desktop-First / Local-First / Enterprise Ready)

**Status:** Em Planejamento

**Público-Alvo da Documentação:** Engenharia, Produto e Design

## **1. Visão Executiva**

O **Grabbe** é uma aplicação desktop de tracking e ranking projetada para ser o ecossistema definitivo de organização de mídias de entretenimento (Jogos, Animes, Mangás, Livros, Quadrinhos, Filmes e Séries).

Construído sob o paradigma **Local-First**, o Grabbe garante que o usuário tenha posse total de seus dados, operando de forma autossuficiente e offline por padrão. O aplicativo entrega uma experiência de altíssimo desempenho, eliminando tempos de carregamento e dependência de conectividade constante, utilizando a nuvem apenas como ferramenta de busca de metadados e, no futuro, para sincronização opcional.

## **2. Escopo e Princípios do Produto**

* **Desktop-First:** Foco inicial em sistemas operacionais desktop (Windows, macOS, Linux) para garantir uma interface rica, navegação em atalhos e máxima performance.
* **Local-First & Offline por Design:** O banco de dados primário reside na máquina do usuário. Funcionalidades de leitura, escrita, ranking e estatísticas não dependem de internet.
* **Agnóstico de Plataforma de Mídia:** Um tracker universal. O usuário não precisa de 5 aplicativos diferentes para registrar o que consome.
* **Minimalismo Funcional:** Interface sem poluição visual, focada na arte da mídia (capas) e na eficiência do registro de dados.

## **3. Arquitetura Técnica Detalhada**

A arquitetura é dividida em dois domínios principais: a **Aplicação Cliente (Desktop)** e o **Serviço de Apoio (BFF na Nuvem)**.

### **3.1. Stack Tecnológico Recomendado**

* **Frontend (Desktop):** Tauri (Core em Rust, Interface em React/TypeScript ou Vue). O Tauri oferece um binário muito menor e consumo de RAM drasticamente inferior ao Electron, essencial para um app que roda em background.
* **Banco de Dados Local:** SQLite via Prisma ORM ou Drizzle (integrado ao frontend) ou via abstração no core em Rust.
* **BFF (Backend for Frontend):** C# (.NET 9.0+) devido à sua excelente performance na manipulação de concorrência e chamadas assíncronas múltiplas para APIs externas.
* **Cache do BFF:** Redis ou IMemoryCache (para armazenar respostas das APIs externas e evitar rate-limiting).

### **3.2. Diagrama de Arquitetura**

```mermaid
graph TD
    subgraph Desktop Client [Grabbe Desktop App - Local First]
        UI[Interface UI - React/Vue]
        Core[Tauri Core - Rust]
        DB[(SQLite Local)]
        
        UI <-->|Comandos / Eventos| Core
        Core <-->|Queries Rápidas / Offline| DB
    end

    subgraph Nuvem [Grabbe Cloud Services]
        BFF[BFF - API Aggregator]
        Redis[(Redis Cache)]
        Sync[Sync Engine - Fase 3]
    end

    subgraph APIs Externas [Provedores de Metadados]
        TMDB[TMDB API - Filmes/Séries]
        IGDB[IGDB API - Jogos]
        Jikan[Jikan API - Animes/Mangás]
        GBooks[Google Books API]
        ComicVine[ComicVine API]
    end

    Core <-->|REST / JSON - Busca de Mídia| BFF
    BFF <-->|Verifica / Salva Cache| Redis
    BFF -->|Fetch Normalizado| TMDB
    BFF -->|Fetch Normalizado| IGDB
    BFF -->|Fetch Normalizado| Jikan
    BFF -->|Fetch Normalizado| GBooks
    BFF -->|Fetch Normalizado| ComicVine
```

## **4. Design do BFF (Backend for Frontend) Agregador**

O BFF atua como um escudo entre o Grabbe Desktop e as APIs de terceiros. O cliente desktop **nunca** faz requisições diretas ao TMDB ou Jikan.

### **4.1. Visão Geral e Responsabilidades**

O Backend for Frontend (BFF) do Grabbe atua como um intermediário (Agregador e Normalizador). Ele tem três responsabilidades principais:

1. **Unificação de Contratos / Normalização:** Independentemente de a origem ser o Jikan, TMDB ou GBooks, o BFF recebe JSONs distintos de APIs diferentes e os transforma em um único padrão (`GrabbeMediaDTO`). O frontend não precisa saber lidar com estruturas JSON diferentes.
2. **Proteção e Gerenciamento de Rate Limit:** APIs como IGDB e Jikan têm limites estritos. O BFF enfileira ou limita chamadas para não estourar os limites gratuitos.
3. **Caching Agressivo (Redis/Memória):** Armazena respostas para buscas repetidas, reduzindo a latência para milissegundos. Ex: Se o usuário busca "Breaking Bad", o BFF consulta o TMDB, formata e salva com um TTL de 7 a 15 dias. A próxima busca baterá apenas no cache.

### **4.2. Estrutura do Projeto e Configuração do Ambiente**

O projeto segue uma estrutura baseada em separação de responsabilidades por features (Vertical Slice Architecture). Para garantir o funcionamento correto e evitar problemas de versionamento de código na IDE, a estrutura do repositório deve ser montada da seguinte forma:

```plaintext
grabbe-bff/  
├── .gitignore               # Deve ignorar .env.local, .idea/ (se aplicável), bin/, obj/  
├── .env.local               # Arquivo local para chaves de API (NÃO deve ser enviado ao repositório)  
├── Grabbe.BFF.sln           # Arquivo da solução (Deve ser enviado ao repositório)  
└── src/  
    └── Grabbe.API/  
        ├── Grabbe.API.csproj  # Arquivo do projeto (Deve ser enviado ao repositório)  
        ├── Program.cs  
        ├── appsettings.json  
        ├── Domain/  
        │   └── DTOs/  
        │       └── GrabbeMediaDTO.cs  
        ├── Features/  
        │   ├── MediaDetails/  
        │   │   ├── DetailsController.cs  
        │   │   └── DetailsService.cs  
        │   └── MediaSearch/  
        │       ├── SearchController.cs  
        │       └── SearchAggregationService.cs  
        └── Infrastructure/  
            ├── Cache/  
            ├── Configuration/  
            │   └── ExternalApiOptions.cs  
            └── ExternalClients/  
                ├── IMediaProviderClient.cs  
                ├── TMDB/  
                ├── Jikan/  
                └── GBooks/
```

**Setup de Desenvolvimento:**
* A solução pode ser aberta nativamente no Rider ou Visual Studio, garantindo que os arquivos `.sln` e `.csproj` estejam devidamente rastreados pelo Git.
* As chaves sensíveis (como a API Key do TMDB e Google) devem ficar isoladas no arquivo `.env.local` na raiz do projeto.

### **4.3. Padrões de Concorrência e Performance**

Para buscas globais (quando o usuário não filtra o tipo de mídia e busca em todas as fontes simultaneamente), o BFF deve otimizar o tempo de resposta realizando chamadas assíncronas concorrentes.

O `MediaAggregationService` utilizará `Task.WhenAll` para disparar as requisições para o TMDB, Jikan e GBooks ao mesmo tempo, aguardar a resolução de todas, achatar as listas, ordenar por relevância e retornar o array unificado ao frontend.

### **4.4. Especificações dos Clients Externos (Inputs)**

O C# mapeará apenas os campos necessários de cada API externa para evitar sobrecarga de memória.

**A. TMDB Client (Filmes e Séries)**
* **Endpoint Base:** `https://api.themoviedb.org/3`
* **Autenticação:** Header `Authorization: Bearer {TMDB_READ_ACCESS_TOKEN}` (Lido do `.env.local`).
* **Mapeamento:**
  * `poster_path` -> `CoverImageUrl` (necessita concatenar com `https://image.tmdb.org/t/p/w500/`)
  * `overview` -> `Description`
  * Se for série (TV), mapear `number_of_episodes` para `TotalProgress`.

**B. Jikan Client (Animes e Mangás)**
* **Endpoint Base:** `https://api.jikan.moe/v4`
* **Autenticação:** Nenhuma (API Aberta).
* **Restrição Crítica:** Limite de 3 requisições por segundo. O `JikanClient` deve implementar política de retentativas (ex: Polly library com backoff exponencial) para lidar com o status 429 Too Many Requests.
* **Mapeamento:**
  * `images.jpg.image_url` -> `CoverImageUrl`
  * `synopsis` -> `Description`
  * `episodes` (Anime) ou `chapters` (Mangá) -> `TotalProgress`

**C. Google Books Client (Livros)**
* **Endpoint Base:** `https://www.googleapis.com/books/v1`
* **Autenticação:** Query param `?key={GBOOKS_API_KEY}` (Lido do `.env.local`).
* **Mapeamento (extraído de volumeInfo):**
  * `imageLinks.thumbnail` -> `CoverImageUrl`
  * `description` -> `Description`
  * `pageCount` -> `TotalProgress`
  * `authors` -> Mapeado como meta-informação, se necessário.

## **5. Estrutura Ideal do Database Schema (SQLite Local)**

O modelo relacional abaixo garante a integridade do histórico do usuário e suporta o sistema de rankings e logs de consumo no cliente Desktop.

```sql
-- TABELA: Media (Armazena o cache local das mídias para funcionamento offline)
CREATE TABLE Media (
    id TEXT PRIMARY KEY, -- UUID gerado localmente
    external_id TEXT NOT NULL, -- ID da API original (ex: TMDB id)
    source_api TEXT NOT NULL, -- 'TMDB', 'JIKAN', 'IGDB', etc.
    type TEXT NOT NULL, -- 'MOVIE', 'GAME', 'ANIME', etc.
    title TEXT NOT NULL,
    description TEXT,
    cover_image_path TEXT, -- Caminho local salvo no media_cache ou URL
    release_date DATE,
    franchise TEXT,
    genres TEXT, -- JSON ou string separada por vírgulas
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: UserTracking (O estado atual e global do usuário em relação à mídia)
CREATE TABLE UserTracking (
    id TEXT PRIMARY KEY,
    media_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'PLANNED', 'CONSUMING', 'PAUSED', 'DROPPED', 'COMPLETED'
    progress INTEGER DEFAULT 0, -- Episódio atual, horas jogadas, ou % de leitura
    total_progress INTEGER, -- Total de episódios/capítulos (copiado da Media)
    rewatch_count INTEGER DEFAULT 0, -- Incrementado automaticamente a cada nova sessão concluída
    notes TEXT, -- Mantido da versão anterior para anotações gerais
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES Media(id)
);

-- TABELA: ConsumptionSession (Registra cada vez que a mídia é consumida/rejogada)
CREATE TABLE ConsumptionSession (
    id TEXT PRIMARY KEY,
    tracking_id TEXT NOT NULL,
    session_number INTEGER DEFAULT 1, -- 1 = Primeira vez, 2 = Primeiro Replay, etc.
    start_date DATETIME,
    finish_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE, -- Identifica se é a sessão que está rodando no momento
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tracking_id) REFERENCES UserTracking(id)
);

-- TABELA: TrackingHistory (Registro imutável para a "Timeline de consumo")
CREATE TABLE TrackingHistory (
    id TEXT PRIMARY KEY,
    tracking_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'STATUS_CHANGE', 'PROGRESS_UPDATE', 'SESSION_START'
    previous_value TEXT,
    new_value TEXT,
    event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tracking_id) REFERENCES UserTracking(id)
);

-- TABELA: Ranking (Avaliações do usuário - 1:1 com a Media)
CREATE TABLE Ranking (
    id TEXT PRIMARY KEY,
    media_id TEXT NOT NULL UNIQUE, -- O UNIQUE garante que a nota seja sempre sobrescrita
    score INTEGER CHECK (score >= 1 AND score <= 10),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Mantido da versão anterior
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES Media(id)
);
```

## **6. Funcionalidades Detalhadas (Core)**

### **6.1. Motor de Tracking**

* **Lógica de Progressão:** O app deve adaptar o controle numérico. Exemplo: Para *Livros*, rastreia Páginas ou Porcentagem. Para *Séries*, Temporada/Episódio. Para *Jogos*, Horas jogadas ou Conquistas (manual).
* **Transições Automáticas:** Se o usuário atualiza o episódio de 1 para 2, o status muda automaticamente de "Planejado" para "Consumindo". Se atinge o total de episódios, muda para "Concluído" e preenche a `finish_date`.

### **6.2. Sistema de Ranking Pessoal**

O usuário terá uma visão global de suas avaliações.
* **Tier List Automática:** Com base nas notas de 1 a 10, o app pode gerar visualizações em formato Lista separando Filmes, Jogos e Animes no mesmo painel.

### **6.3. Gestão de Datas de Consumo (Timeline Control)**

* **Preenchimento Automático Inteligente:** O sistema registrará automaticamente a `start_date` no dia em que o status mudar para "Consumindo" e a `finish_date` no dia em que mudar para "Concluído".
* **Controle Manual (Sobrescrita):** O usuário terá total liberdade para editar essas datas através de um Date Picker.
* **Casos de Uso Suportados:**
  * **Catalogação Retroativa:** Inserir mídias consumidas no passado.
  * **Correção de Esquecimento:** Ajustar a data de conclusão para dias passados.
  * **Preparação para Importação:** Estrutura pronta para receber dados importados (MyAnimeList, Letterboxd, etc).

### **6.4. Sistema de Replay / Rewatch / Reread**

* **Histórico de Sessões:** Cada "Replay" criará uma nova "Sessão de Consumo" atrelada àquela mídia, com suas próprias `start_date` e `finish_date`.
* **Preservação de Dados:** Os replays anteriores ficarão salvos no "Histórico" da mídia.
* **Sobrescrita de Avaliação:** A nota e a review em texto são singulares por mídia. Ao reavaliar, os dados anteriores são sobrescritos, refletindo a visão mais atual do usuário.

## **7. Contratos de Comunicação e Endpoints (BFF ↔ Desktop)**

### **7.1. Padrão de Objeto Unificado (GrabbeMediaDTO)**

Este é o schema que o aplicativo em React/Tauri vai consumir. O C# garante que ele sempre saia neste formato, independentemente da fonte original.

**A. Classe C# (Saída do BFF):**
```csharp
namespace Grabbe.API.Domain.DTOs;

public class GrabbeMediaDTO  
{  
    public required string ExternalId { get; set; }  
    public required string SourceApi { get; set; } // "TMDB", "JIKAN", "GBOOKS"  
    public required string Type { get; set; }      // "MOVIE", "SERIES", "ANIME", "MANGA", "BOOK"  
    public required string Title { get; set; }  
    public string? Description { get; set; }  
    public string? CoverImageUrl { get; set; }  
    public string? ReleaseDate { get; set; }       // ISO 8601 (YYYY-MM-DD)  
    public List<string> Genres { get; set; } = new();  
    public int? TotalProgress { get; set; }        // Episódios totais ou páginas do livro  
}

public class PaginatedResponse<T>  
{  
    public required IEnumerable<T> Data { get; set; }  
    public int CurrentPage { get; set; }  
    public int TotalPages { get; set; }  
    public int TotalResults { get; set; }  
}
```

**B. JSON de Resposta (Consumido pelo Frontend):**
```json
{
  "externalId": "string",
  "sourceApi": "string",
  "type": "string",
  "title": "string",
  "description": "string",
  "coverImageUrl": "string",
  "releaseDate": "string",
  "franchise": "string",
  "genres": ["string"],
  "totalProgress": 0
}
```

### **7.2. Endpoints do BFF**

**1. Busca Global (Concorrente)**
Responsável por buscar mídias a partir da barra de pesquisa. Se nenhum tipo for especificado, aciona todas as APIs via `Task.WhenAll` e mescla os resultados.
* **Rota:** `GET /api/v1/search?query={texto}&type={MOVIE|ANIME|BOOK}&page=1`
* **Exemplo de Resposta:**
```json
{
  "data": [
    {
      "externalId": "tt0903747",
      "sourceApi": "TMDB",
      "type": "SERIES",
      "title": "Breaking Bad",
      "description": "Um professor de química...",
      "coverImageUrl": "https://image.tmdb.org/t/p/w500/...",
      "releaseDate": "2008-01-20",
      "genres": ["Drama", "Crime"],
      "totalProgress": 62
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 3,
    "totalResults": 45
  }
}
```

**2. Detalhes Profundos da Mídia**
Busca os metadados profundos da obra contornando limites de cache de busca em lote.
* **Rota:** `GET /api/v1/media/{sourceApi}/{type}/{externalId}`
* **Exemplo:** `/api/v1/media/JIKAN/ANIME/11004`
* **Exemplo de Resposta:**
```json
{
  "data": {
    "externalId": "11004",
    "sourceApi": "JIKAN",
    "type": "ANIME",
    "title": "Hunter x Hunter (2011)",
    "description": "Gon Freecss sonha em se tornar um Hunter...",
    "coverImageUrl": "https://cdn.myanimelist.net/...",
    "releaseDate": "2011-10-02",
    "genres": ["Action", "Adventure"],
    "totalProgress": 148,
    "extraMetadata": {
      "studios": ["Madhouse"],
      "status": "Finished Airing"
    }
  }
}
```

**3. Trending (Itens em Alta)**
Alimenta a aba "Descobrir".
* **Rota:** `GET /api/v1/trending?type={mediaType}`

### **7.3. Tratamento de Erros Padronizado**

Se houver falha na API externa ou o rate limit for estourado, o front-end receberá este formato:

```json
{
  "error": {
    "code": "EXTERNAL_API_RATE_LIMIT",
    "message": "A API de origem (JIKAN) está limitando as requisições no momento. Tente novamente.",
    "sourceApi": "JIKAN"
  }
}
```

## **8. Motor de Retenção, Identidade e Shareability**

### **8.1. Grabbe Recap (O "Wrapped" do Entretenimento)**
* **Frequência:** Mensal e Anual.
* **Exportação:** Formato "Story" (9:16) ou paisagem, gerando um `.png` em um clique.
* **Insights Locais:** Tempo Investido, "Sua Trindade do Mês", Hábitos de Maratona.

### **8.2. Cartão de Perfil Unificado**
* **Hall da Fama:** Fixar 4 a 5 obras favoritas no topo.
* **Estatísticas:** Mídias concluídas, gráfico de radar de consumo, horas de vida investidas.
* **Exportação:** Banner horizontal para redes sociais.

### **8.3. Dashboard Analítico Profundo**
* **Conexões de Nicho:** Padrões de gosto por estúdio/gênero.
* **Dispersão e Viés:** Correlação entre Nota Atribuída e Ano de Lançamento.

## **9. Roadmap de Produto e Entregas**

### **Fase 1: MVP - Foco em Retenção Local**
* [ ] Setup da arquitetura Desktop (Tauri) + SQLite.
* [x] Implementação do BFF para provedores iniciais.
* [ ] Operações CRUD no rastreamento local.
* [ ] Interface Principal.
* [ ] Sistema de Ranking Básico (1 a 10).

### **Fase 2: Identidade, Engajamento e Estatísticas**
* [ ] Cartão de Perfil Unificado com Banner exportável.
* [ ] Personalizacao de tema.
* [ ] Grabbe Recap (Story Export).
* [ ] Dashboard Analítico.
* [ ] Timeline de Consumo.
* [ ] Exportação/Importação de dados manuais.

### **Fase 3: Cloud e Ecossistema**
* [ ] Sync Engine (Event Sourcing).
* [ ] Apps mobile (iOS/Android).
* [ ] Perfis Públicos na Web (ex: grabbe.app/u/usuario).
