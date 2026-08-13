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

Documents are extracted in the browser (PDF, DOCX, ODT, TXT). The backend enriches requests with pedagogical prompts and calls Gemini.

### Core Principles

- **Fast preparation**: generate usable lesson sheets with minimal input.
- **Teacher-ready output**: concrete phases, spoken instructions, expected answers and differentiation.
- **Quota-aware generation**: fast Gemini model by default, advanced mode when needed.
- **Simple ownership**: authenticated users keep and manage their own sheets.

## Architecture

| Component | Role | Port |
| --- | --- | --- |
| `frontend` | React/Vite UI, document extraction, XLSX export | 80 / 5173 |
| `backend` | Go API, auth, prompts, Gemini integration | 8080 |
| `postgres` | Users and saved preparation sheets | 5432 |

The backend follows a small hexagonal structure:

```text
backend/internal/core      domain, ports, services
backend/internal/adapter   HTTP, Gemini, PostgreSQL, security
frontend/src               React application
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Gemini API key
- Node.js 22 (frontend development only)
- Go 1.26 (backend development only)

## Running

### Fully dockerized

```bash
cp .env.example .env
# fill GEMINI_API_KEY and JWT_SECRET
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
GEMINI_API_KEY=... JWT_SECRET=dev DATABASE_URL=postgres://prepai:prepai@localhost:5432/prepai?sslmode=disable go run ./cmd/api
```

### Frontend only

```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:5173

## Gemini Models

| Mode | Model |
| --- | --- |
| Default | `gemini-3.5-flash-lite` |
| Fallback on 429 | `gemini-3.1-flash-lite` |
| Advanced reasoning | `gemini-3.6-flash` |

The model names can be overridden with `GEMINI_DEFAULT_MODEL`, `GEMINI_FALLBACK_MODEL` and `GEMINI_ADVANCED_MODEL`.

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
