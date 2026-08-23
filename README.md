# PrepAI

[![CI](https://github.com/axelfrache/prep-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/axelfrache/prep-ai/actions/workflows/ci.yml)
[![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Description

PrepAI is a lesson-preparation assistant for teachers.

It helps users create a complete preparation sheet from a few inputs, improve an existing sheet while preserving its structure, and keep a history of generated sheets.

Documents are extracted in the browser (PDF, DOCX, ODT, TXT). The backend enriches requests with pedagogical prompts and calls [ai-gateway](https://github.com/axelfrache/ai-gateway) for generation.

### Core Principles

- **Fast preparation**: generate usable lesson sheets with minimal input.
- **Teacher-ready output**: concrete phases, spoken instructions, expected answers and differentiation.
- **Quota-aware generation**: fast fallback-chain model by default, advanced mode when needed.
- **Simple ownership**: authenticated users keep and manage their own sheets.

## Architecture

| Component | Role | Port |
| --- | --- | --- |
| `frontend` | React/Vite UI, document extraction, XLSX export | 80 / 5173 |
| `backend` | Go API, auth, prompts, ai-gateway integration | 8080 |
| `postgres` | Users and saved preparation sheets | 5432 |

The backend follows a small hexagonal structure:

```text
backend/internal/core      domain, ports, services
backend/internal/adapter   HTTP, ai-gateway, PostgreSQL, security
frontend/src               React application
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- An [ai-gateway](https://github.com/axelfrache/ai-gateway) instance and one of its `GATEWAY_API_KEYS`
- Node.js 22 (frontend development only)
- Go 1.26 (backend development only)

## Running

### Fully dockerized

```bash
cp .env.example .env
# fill AI_GATEWAY_URL, AI_GATEWAY_API_KEY and JWT_SECRET
docker compose up --build
```

Then open:

- App: http://localhost:8080
- Health check: http://localhost:8080/api/health

To stop:

```bash
docker compose down
```

Use `-v` to also remove the database volume.

### Backend only

```bash
cd backend
AI_GATEWAY_URL=http://localhost:8081 AI_GATEWAY_API_KEY=... JWT_SECRET=dev DATABASE_URL=postgres://prepai:prepai@localhost:5432/prepai?sslmode=disable go run ./cmd/api
```

### Frontend only

```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:5173

## AI Gateway

Generation is delegated to an [ai-gateway](https://github.com/axelfrache/ai-gateway) instance rather than calling Gemini directly, so it benefits from the gateway's own multi-provider fallback and JSON-schema-constrained structured output.

| Mode | Model sent to ai-gateway |
| --- | --- |
| Default (`fast`) | `ai-gateway:json` (resolves to the gateway's `JSON_MODEL_FALLBACKS` chain: Gemini → Groq → Mistral → OpenRouter) |
| Advanced reasoning | `gemini:gemini-3.6-flash` (pinned; add `AI_GATEWAY_ADVANCED_FALLBACK_MODEL` for a second attempt on rate limit/unavailability) |

`AI_GATEWAY_URL` points at the gateway (e.g. `http://ai-gateway.ai.svc.cluster.local:8080` in-cluster). `AI_GATEWAY_API_KEY` must be one of the gateway's configured `GATEWAY_API_KEYS`. The model strings can be overridden with `AI_GATEWAY_DEFAULT_MODEL` and `AI_GATEWAY_ADVANCED_MODEL` (any `provider:model` string or gateway alias, see the ai-gateway README). `AI_GATEWAY_ADVANCED_FALLBACK_MODEL` is optional and empty by default — advanced mode stays pinned to a single model unless it's set.

## Code Quality

CI runs checks for both backend and frontend on every push and pull request.

### Backend

```bash
cd backend
gofmt -w .
go vet ./...
go test ./...
```

### Frontend

```bash
cd frontend
npm run format:check
npm run lint
npm run test
npm run build
```
