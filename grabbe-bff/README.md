# Grabbe BFF (Backend for Frontend)

*(Para a versão em Português, role para baixo / For Portuguese version, scroll down)*

This is the **BFF (Backend for Frontend)** of the Grabbe project, acting as an intermediary (Aggregator and Normalizer) between the client application (Desktop/Tauri) and multiple external entertainment APIs. The main goal is to provide a single, simplified, and optimized point of contact for the frontend app, shielding the client from API differences, managing rate limits, and applying caching.

## Current Status

The project was set up using **Vertical Slice Architecture** in **.NET 8** and has already completed its first architectural phase.

**Features already implemented and structured:**
- [x] C# Architecture setup (clean `Program.cs`, based on dependency injection).
- [x] Environment Variables configured securely in the `.env.local` file using the `DotNetEnv` library.
- [x] HTTP Clients registered and mapped for the 3 main APIs:
  - **TMDB Client** (Movies and Series)
  - **Jikan Client** (Anime and Manga)
  - **Google Books Client** (Books)
- [x] Polymorphism and abstraction completed: the 3 clients extend and register the unifying `IMediaProviderClient` interface.
- [x] Structure of the `MediaSearch` feature (With `SearchAggregationService` for concurrent searches).
- [x] Structure of the `MediaDetails` feature (With `DetailsService` for deep search of a specific media).
- [x] HTTP Pipeline configured and `Swagger` ready for documentation and testing in the development environment.

## Directory Structure

The structure is divided vertically to facilitate maintenance and scaling, keeping logical contexts isolated:

```plaintext
src/Grabbe.API/
├── Domain/
│   └── DTOs/
│       └── GrabbeMediaDTO.cs       # Unified Output Object (Front-Back Contract)
├── Features/
│   ├── MediaDetails/               # Endpoint (Controller) and Specific Details Service
│   └── MediaSearch/                # Endpoint (Controller) and Search Service (Aggregated or by Type)
├── Infrastructure/
│   ├── Configuration/
│   │   └── ExternalApiOptions.cs   # Configurations mapped from .env keys
│   └── ExternalClients/            # Mappings and integrations via HttpClient
│       ├── IMediaProviderClient.cs # Media providers contract
│       ├── TMDB/
│       ├── Jikan/
│       └── GBooks/
```

## How to Run Locally

### 1. Requirements

- [.NET 9.0+ SDK](https://dotnet.microsoft.com/en-us/download/dotnet/9.0) installed on your machine.

### 2. Setting up API Keys

In the **root of the `grabbe-bff` folder** (next to the `.sln` file), create a file named `.env.local` to isolate your credentials.

Add the necessary keys following the pattern below:

```env
TMDB_API_KEY=your_tmdb_key_here
GBOOKS_API_KEY=your_google_books_key_here
```

*(Note: The Jikan API is open and does not require a key).*

The repository is already configured in `.gitignore` to never commit `.env.local`.

### 3. Running the Application

Run the application through the terminal by accessing the main directory:

```bash
dotnet restore
dotnet build
dotnet run --project src/Grabbe.API/Grabbe.API.csproj
```

If you are using an IDE like **Visual Studio** or **Rider**, just open the `Grabbe.BFF.sln` file and run the application natively via the "Run" button (debug profile).

### 4. Accessing the Documentation (Swagger)

With the project running in *Development* mode, open your browser at the URL mapped by the terminal (usually local), followed by the swagger path:

`http://localhost:5244/swagger`

---

# Grabbe BFF (Backend for Frontend) - Português

Este é o **BFF (Backend for Frontend)** do projeto Grabbe, atuando como um intermediário (Agregador e Normalizador) entre a aplicação cliente (Desktop/Tauri) e múltiplas APIs externas de entretenimento. O objetivo central é fornecer um único ponto de contato simplificado e otimizado para o app frontend, blindando o cliente de diferenças entre APIs, gerenciando rate-limits e aplicando cache.

## Status Atual

O projeto foi configurado utilizando a **Vertical Slice Architecture** em **.NET 8** e já concluiu sua primeira fase arquitetural.

**Recursos já implementados e estruturados:**
- [x] Configuração da Arquitetura C# (`Program.cs` limpo, baseada em injeção de dependência).
- [x] Configuração de Variáveis de Ambiente localizadas de forma segura no arquivo `.env.local` usando a biblioteca `DotNetEnv`.
- [x] Clientes HTTP registrados e mapeados para as 3 APIs principais:
  - **TMDB Client** (Filmes e Séries)
  - **Jikan Client** (Animes e Mangás)
  - **Google Books Client** (Livros)
- [x] Polimorfismo e abstração concluídos: os 3 clients estendem e registram a interface unificadora `IMediaProviderClient`.
- [x] Estrutura da *feature* `MediaSearch` (Com o `SearchAggregationService` para buscas concorrentes).
- [x] Estrutura da *feature* `MediaDetails` (Com o `DetailsService` para busca profunda de uma mídia específica).
- [x] Pipeline HTTP configurado e `Swagger` pronto para documentação e testes em ambiente de desenvolvimento.

## Estrutura de Diretórios

A estrutura é dividida verticalmente para facilitar manutenção e escala, mantendo contextos lógicos isolados:

```plaintext
src/Grabbe.API/
├── Domain/
│   └── DTOs/
│       └── GrabbeMediaDTO.cs       # Objeto de Saída Unificado (Contrato Front-Back)
├── Features/
│   ├── MediaDetails/               # Endpoint (Controller) e Serviço de Detalhes Específicos
│   └── MediaSearch/                # Endpoint (Controller) e Serviço de Busca (Agregada ou por Tipo)
├── Infrastructure/
│   ├── Configuration/
│   │   └── ExternalApiOptions.cs   # Configurações mapeadas a partir das chaves do .env
│   └── ExternalClients/            # Mapeamentos e integrações via HttpClient
│       ├── IMediaProviderClient.cs # Contrato dos provedores de mídia
│       ├── TMDB/
│       ├── Jikan/
│       └── GBooks/
```

## Como Executar Localmente

### 1. Requisitos

- [SDK do .NET 9.0+](https://dotnet.microsoft.com/en-us/download/dotnet/9.0) instalado na máquina.

### 2. Configurando as Chaves de API

Na **raiz da pasta `grabbe-bff`** (junto do arquivo `.sln`), crie um arquivo chamado `.env.local` para isolar suas credenciais.

Adicione as chaves necessárias seguindo o padrão abaixo:

```env
TMDB_API_KEY=sua_chave_do_tmdb_aqui
GBOOKS_API_KEY=sua_chave_do_google_books_aqui
```

*(Nota: A API do Jikan é aberta e não necessita de chave).*

O repositório já está configurado no `.gitignore` para nunca comitar o `.env.local`.

### 3. Executando a Aplicação

Rode a aplicação através do terminal acessando o diretório principal:

```bash
dotnet restore
dotnet build
dotnet run --project src/Grabbe.API/Grabbe.API.csproj
```

Se você estiver usando uma IDE como **Visual Studio** ou **Rider**, basta abrir o arquivo `Grabbe.BFF.sln` e rodar a aplicação nativamente pelo botão "Run" (perfil de debug).

### 4. Acessando a Documentação (Swagger)

Com o projeto rodando em modo *Development*, abra seu navegador na URL mapeada pelo terminal (geralmente local), seguido do caminho do swagger:

`http://localhost:5244/swagger`
