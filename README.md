# Prep AI

Assistant de préparation pédagogique pour le Cycle 2 / CE2 : **créer** une fiche de séance ou **améliorer** une fiche existante. L'extraction des documents (PDF, DOCX, ODT, TXT) se fait dans le navigateur ; le backend ajoute les prompts métier et appelle Gemini.

## Structure

```
backend/    API Go — architecture hexagonale (ports & adapters)
frontend/   SPA React + TypeScript + Vite + Tailwind + shadcn/ui
docker-compose.yml
```

## Démarrage (Docker)

```bash
cp .env.example .env   # renseigner GEMINI_API_KEY
docker compose up --build
```

App sur http://localhost:8080.

## Développement

```bash
# Backend
cd backend && GEMINI_API_KEY=... go run ./cmd/api   # :8080

# Frontend
cd frontend && npm install && npm run dev           # :5173
```

## API

| Méthode | Route          |
| ------- | -------------- |
| POST    | `/api/create`  |
| POST    | `/api/improve` |
| GET     | `/api/health`  |

## Variables d'environnement

`PORT`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `ALLOWED_ORIGINS`.
