# Prep AI

Assistant de préparation pédagogique pour le Cycle 2 / CE2 : **créer** une fiche de séance ou **améliorer** une fiche existante. L'extraction des documents (PDF, DOCX, ODT, TXT) se fait dans le navigateur ; le backend ajoute les prompts métier et appelle Gemini. Chaque utilisateur a un compte et retrouve l'historique de ses fiches.

Par défaut, la génération utilise Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`). Si ce modèle répond 429, le backend réessaie avec Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`). L'option **Raisonnement avancé** dans l'interface bascule ponctuellement sur Gemini 3.6 Flash (`gemini-3.6-flash`) pour de meilleurs résultats, avec des quotas plus limités.

## Structure

```
backend/    API Go — architecture hexagonale (ports & adapters)
frontend/   SPA React + TypeScript + Vite + Tailwind + shadcn/ui
docker-compose.yml   backend + frontend (nginx) + Postgres
```

## Démarrage (Docker)

```bash
cp .env.example .env   # renseigner GEMINI_API_KEY et JWT_SECRET
docker compose up --build
```

App sur http://localhost:8080. Le schéma Postgres est créé automatiquement au démarrage.

## Développement

```bash
# Postgres (dev)
docker run -d --name prepai-db -e POSTGRES_USER=prepai -e POSTGRES_PASSWORD=prepai \
  -e POSTGRES_DB=prepai -p 5432:5432 postgres:16-alpine

# Backend
cd backend && GEMINI_API_KEY=... JWT_SECRET=dev go run ./cmd/api   # :8080

# Frontend
cd frontend && npm install && npm run dev                          # :5173
```

## API

| Méthode | Route                 | Auth |
| ------- | --------------------- | ---- |
| POST    | `/api/auth/register`  | non  |
| POST    | `/api/auth/login`     | non  |
| POST    | `/api/create`         | oui  |
| POST    | `/api/improve`        | oui  |
| GET     | `/api/sheets`         | oui  |
| GET     | `/api/sheets/{id}`    | oui  |
| POST    | `/api/sheets/{id}/improve` | oui  |
| DELETE  | `/api/sheets/{id}`    | oui  |
| GET     | `/api/health`         | non  |

Auth par JWT : envoyer `Authorization: Bearer <token>`. Mots de passe hachés avec bcrypt.

## Variables d'environnement

`PORT`, `GEMINI_API_KEY`, `GEMINI_DEFAULT_MODEL`, `GEMINI_ADVANCED_MODEL`, `GEMINI_FALLBACK_MODEL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_TTL`, `ALLOWED_ORIGINS`.
