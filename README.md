# Dala Smart Back

Backend API for Dala Smart.

## Start

```bash
npm install
cp .env.example .env
npm run dev
```

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/animals`
- `GET /api/animals`
- `GET /api/animals/:id`

Protected routes require:

```http
Authorization: Bearer <token>
```
