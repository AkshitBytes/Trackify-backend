# Trackify Backend

Express + MongoDB API for Trackify (DSA Progress Tracker).

This service handles:
- authentication (JWT)
- question CRUD
- question status updates
- search/filtering
- analytics/stats endpoints

## Tech stack

- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Tokens
- express-validator

## Folder structure

```text
backend/
  config/              # DB connection
  controllers/         # route handlers
  middleware/          # auth middleware
  models/              # Mongoose schemas
  routes/              # API route definitions
  server.js            # app entry
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas or local MongoDB

## Environment variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
```

## Installation

```bash
cd backend
npm install
```

## Scripts

```bash
npm run dev    # run with node --watch
npm start      # run in normal mode
```

## Run locally

```bash
cd backend
npm run dev
```

API base URL:
- `http://localhost:5000/api`

## API routes

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)

### Questions (authenticated)
- `GET /api/questions`
  - query params:
    - `topic`
    - `pattern`
    - `status`
    - `difficulty`
    - `search`
    - `sortBy`
    - `order` (`asc`/`desc`)
- `POST /api/questions`
- `PUT /api/questions/:id`
- `DELETE /api/questions/:id`
- `PATCH /api/questions/:id/status`
- `PATCH /api/questions/reorder`

### Stats (authenticated)
- `GET /api/stats`
  - returns overview (`done`, `inProgress`, `solvedToday`, etc.)
  - topic-level and difficulty-level summaries

## Auth details

- Use JWT in `Authorization` header:

```text
Authorization: Bearer <token>
```

- Token payload includes user id and email.

## Question model highlights

Question supports:
- `title`
- `topic` (dynamic/custom supported)
- `pattern` (subcategory support)
- `difficulty` (`Easy`/`Medium`/`Hard`)
- `status` (`todo`/`in-progress`/`done`/`revision`)
- `link`, `notes`, `order`, `completedAt`

## Important behavior

- `completedAt` is auto-set when status becomes `done`.
- `solvedToday` is computed from `completedAt` timestamps.
- Search can match title, topic, and pattern.

## Troubleshooting

- Mongo errors: verify `MONGO_URI` and Atlas IP allowlist.
- JWT errors: verify `JWT_SECRET` and token formatting.
- CORS issues: update allowed origins in `server.js`.

## Security notes

- Do not commit `.env` with real secrets.
- Rotate JWT secret for production.
- Add request rate-limiting and stricter validation before public deployment.
