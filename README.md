# Galaxy Messages

Galaxy Messages is a two-app project:
- `frontend/`: Next.js 16, React Three Fiber, drei, Zustand, Tailwind, Framer Motion
- `backend/`: NestJS 11, TypeORM, PostgreSQL, Redis, Socket.io, DTO validation, sanitize-html

## Environment

Backend:
- copy `backend/.env.example` to `backend/.env`

Frontend:
- copy `frontend/.env.local.example` to `frontend/.env.local`

## Local services

Start PostgreSQL and Redis:

The local stack uses PostgreSQL on 5433 so it won't collide with an existing database on 5432.

```bash
docker compose up -d
```

## Install

```bash
npm install
```

## Run

In one terminal:

```bash
npm run dev:backend
```

In another terminal:

```bash
npm run dev:frontend
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000`

## Notes

- Messages are anonymous and IPs are SHA-256 hashed before persistence.
- Posting is limited to 1 message per 60 seconds per IP.
- Likes are limited to 10 per minute per IP and 1 like per body per IP.
- Existing bodies load over REST first, then live updates stream over Socket.io.
- The Three.js scene includes spiral arms, a glowing core, hover states, featured shooting stars, nebula clustering, supernova flashes, and a high-body-count instanced fallback.

