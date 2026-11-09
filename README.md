# Computer Inventory

A full-stack app for cataloguing, searching and editing computer hardware specifications.

- **Backend:** .NET 10 Minimal APIs, vertical slice architecture, EF Core 10, SQL Server Express
- **Frontend:** React + TypeScript (Vite), Redux Toolkit / RTK Query, MUI
- **Infrastructure:** Docker Compose

> Work in progress. Setup and architecture notes will be filled in as the project grows.

## Repository layout

```
backend/    .NET solution (API + integration tests)
frontend/   React SPA
```

## Prerequisites

- .NET SDK 10
- Node.js 24+
- Docker Desktop (on Apple Silicon, enable *Use Rosetta for x86/amd64 emulation*)

## Running locally

```bash
docker compose up -d db         # SQL Server Express (dev password defaults in docker-compose.yml)

dotnet run --project backend/src/ComputerInventory.Api   # http://localhost:5080 (API docs at /scalar)
cd frontend && npm install && npm run dev                # http://localhost:5173
```

## Tests

```bash
dotnet test backend/
cd frontend && npm test
```
