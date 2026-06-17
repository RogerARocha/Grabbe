# Grabbe BFF (Backend for Frontend)

This is the **BFF (Backend for Frontend)** of the Grabbe project, acting as an intermediary (Aggregator and Normalizer) between the client application (Desktop/Tauri) and multiple external entertainment APIs. The main goal is to provide a single, simplified, and optimized point of contact for the frontend app, shielding the client from API differences, managing rate limits, and applying caching.

## Current Status

The project was set up using **Vertical Slice Architecture** in **.NET 9** and has already completed its first architectural phase.

**Features already implemented and structured:**
- [x] C# Architecture setup (clean `Program.cs`, based on dependency injection).
- [x] Environment Variables configured securely in the `.env.local` file using the `DotNetEnv` library.
- [x] HTTP Clients registered and mapped for the 4 main APIs:
  - **TMDB Client** (Movies and Series)
  - **Jikan Client** (Anime and Manga)
  - **OpenLibrary Client** (Books)
  - **IGDB Client** (Games)
- [x] Polymorphism and abstraction completed: the 4 clients extend and register the unifying `IMediaProviderClient` interface.
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
│   │   └── AppSettingsService.cs   # Service responsible for resolving application settings and credentials
│   └── ExternalClients/            # Mappings and integrations via HttpClient
│       ├── IMediaProviderClient.cs # Media providers contract
│       ├── TMDB/
│       ├── Jikan/
│       ├── OpenLibrary/
│       └── IGDB/
```

## How to Run Locally

### 1. Requirements

- [.NET 9.0+ SDK](https://dotnet.microsoft.com/en-us/download/dotnet/9.0) installed on your machine.

### 2. Setting up API Keys

In the **root of the `grabbe-bff` folder** (next to the `.sln` file), create a file named `.env.local` to isolate your credentials.

Add the necessary keys following the pattern below:

```env
TMDB_API_KEY=your_tmdb_key_here
IGDB_CLIENT_ID=your_igdb_client_id_here
IGDB_CLIENT_SECRET=your_igdb_client_secret_here
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

`http://localhost:18493/swagger`
