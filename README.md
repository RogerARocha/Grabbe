 # Grabbe 🎬🎮📚

**The Collector's App** — Local-First desktop application designed to be the ultimate ecosystem for tracking and organizing all your entertainment media (Movies, Series, Anime, Manga, Games, and Books).

![Grabbe Concept](https://img.shields.io/badge/Status-In%20Development-F848A1?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-2.0-24c8db?style=for-the-badge&logo=tauri)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)
![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet)

## 📖 Overview

**Grabbe** is built for collectors. It goes beyond simple web tracking by operating entirely offline-first, keeping your primary database securely on your machine. It relies on the cloud purely as a metadata search engine to fetch deep information about the media you consume.

## 🚀 Getting Started

To run the full Grabbe ecosystem locally, you will need to start both the BFF (to provide search capabilities) and the Desktop App.

### 1. Running the BFF (Backend for Frontend)
The BFF requires the .NET 9.0 SDK and API keys for TMDB and Google Books.
1. Navigate to `grabbe-bff/`
2. Create your `.env.local` file (see `grabbe-bff/README.md` for instructions).
3. Run the service:
```bash
cd grabbe-bff
dotnet run --project src/Grabbe.API/Grabbe.API.csproj
```
*The API will be available at `http://localhost:5244/swagger`.*

### 2. Running the Desktop App (Tauri + React)
The desktop client requires Node.js and the Rust toolchain (for Tauri).
1. Navigate to `grabbe-app/`
2. Install dependencies:
```bash
cd grabbe-app
npm install
```
3. Run the development server (which compiles the Tauri app):
```bash
npm run tauri dev
```

## 📚 Documentation

For an in-depth look at how Grabbe works, check out the core documentation files in the root directory:

- [Architecture & Context (`ARCHITECTURE_CONTEXT.md`)](./ARCHITECTURE_CONTEXT.md): Full PRD, tech stack details, database schemas, and endpoints.
- [Design System (`DESIGN.md`)](./DESIGN.md): The aesthetic guidelines, typography, and core CSS effects.
- [BFF Setup (`grabbe-bff/README.md`)](./grabbe-bff/README.md): Specific instructions for the C# backend.

---

## License & Terms

Este projeto está sob a licença [MIT](./LICENSE).

### English
⚠️ Legal Disclaimer
Grabbe is a media aggregator developed for educational and personal purposes.

Metadata & Images: All movie posters, book covers, and anime thumbnails displayed in the application are provided by third-party APIs (TMDB, Google Books, and Jikan). These assets are the intellectual property of their respective owners (studios, publishers, and creators). This project does not claim any ownership over these media assets.

API Usage: This application uses the API services but is not endorsed or certified by any of the providers mentioned above.

Fair Use: The use of these assets is intended for metadata visualization and personal organization under fair use principles for educational development.

---
Developed by Roger Rocha.
