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

dotnet tool restore --tool-manifest backend/dotnet-tools.json   # dotnet-ef, for creating migrations
dotnet run --project backend/src/ComputerInventory.Api   # http://localhost:5080 (API docs at /scalar); applies migrations + seed on startup
cd frontend && npm install && npm run dev                # http://localhost:5173
```

## Configuration

| Setting | Where | Default |
|---|---|---|
| `VITE_API_BASE_URL` | frontend build-time env var | `/api` (same origin, via the Vite dev proxy / nginx). Can be absolute. |
| `API_URL` | Vite dev proxy target | `http://localhost:5080` |
| `RateLimiting:PermitLimit` / `WindowSeconds` | API `appsettings.json` | 300 requests per 60 s per client IP |

## Tests

```bash
dotnet test backend/tests/ComputerInventory.Api.UnitTests          # fast, no dependencies
dotnet test backend/tests/ComputerInventory.Api.IntegrationTests   # real SQL Server via Testcontainers (needs Docker)
cd frontend && npm test
```

Pure logic (validators, helpers) is unit-tested; anything whose correctness depends on SQL Server
(queries, constraints, migrations) is integration-tested against a real SQL Server container.
