# Chat App API

Real-time chat backend: **NestJS + PostgreSQL (Prisma) + Socket.IO**, with JWT auth (httpOnly cookies), email verification, and rate limiting.

- REST + WebSocket (`/chat` namespace) API
- Swagger docs at **`/docs`**
- 1:1 (direct) chats now; data model is forward-compatible with group chats

---

## Local setup

```bash
yarn install                       # install deps
cp .env.example .env               # then fill in real values
yarn prisma migrate dev            # create/apply DB schema locally
yarn prisma generate               # regenerate Prisma client (after schema changes)
yarn run start:dev                 # run with hot reload
```

API: `http://localhost:3000` · Swagger: `http://localhost:3000/docs`

### Environment variables

All vars are validated with Zod at startup (`src/config/env.validation.ts`) — the app **won't boot** if any are missing/invalid. See `.env.example` for the full list. Key groups:

| Group | Vars |
|-------|------|
| Database | `DATABASE_URL`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| Auth | `JWT_SECRET`, `JWT_ACCESS_TOKEN_TTL`, `JWT_REFRESH_TOKEN_TTL`, `COOKIE_DOMAIN` |
| Mail | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| App | `NODE_ENV` (`development` \| `production` \| `staging`), `CLIENT_URL`, `PORT` (optional, default `3000`) |

---

## ✅ Production deployment checklist

Do these every time you deploy to prod:

1. **Set `NODE_ENV=production`.** This is what enables `trust proxy` in `src/main.ts` (see below). Also set every other env var from the table above (`CLIENT_URL` must be the real frontend origin — it drives both CORS and email links).

2. **Run migrations with `deploy`, not `dev`:**
   ```bash
   yarn prisma migrate deploy
   ```
   `migrate dev` is for local only (it can reset/prompt). `migrate deploy` just applies pending migrations.

3. **Build and start:**
   ```bash
   yarn run build
   yarn run start:prod
   ```

4. **Configure the reverse proxy (nginx / load balancer).** The app sits behind a proxy in prod, so the proxy **must** forward the real client IP and support WebSocket upgrades. Without `X-Forwarded-For`, the rate limiter sees the proxy's IP and throttles *all users as one*.

   - **Managed platforms** (AWS ALB, GCP LB, Cloudflare, Render, Railway, Heroku, Fly.io): `X-Forwarded-For` is set automatically — nothing to do.
   - **Self-managed nginx:** add to your proxy block:
     ```nginx
     location / {
         proxy_pass http://localhost:3000;
         proxy_set_header Host $host;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;

         # required for Socket.IO (WebSocket upgrade)
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
     }
     ```

   > `trust proxy` is set to `1` (trust one hop). If you have **more than one** proxy in front, bump the number in `src/main.ts`, otherwise clients could spoof their IP via the header.

5. **Verify** after deploy: hit any endpoint and confirm logged `req.ip` is the real client IP (not the proxy's). If it's the proxy IP, step 4 isn't applied.

---

## Rate limiting

Powered by `@nestjs/throttler` (per-IP for REST, per-user for WebSocket).

- Global default: **100 requests / minute** on all REST routes.
- Tighter limits: message send (`POST /chat/:id/message` & WS `message.send`) 30/10s; auth endpoints 3–10/min.
- Storage is **in-memory**. This is per-instance — if you run **multiple instances**, limits won't be shared. When you scale horizontally, switch to a shared store (`@nest-lab/throttler-storage-redis`) in `ThrottlerModule` (`src/app.module.ts`).

---

## Useful commands

```bash
yarn run start:dev        # dev with hot reload
yarn run build            # compile to dist/
yarn run start:prod       # run compiled build
yarn run lint             # ESLint (auto-fix)
yarn run test             # unit tests
yarn run test:e2e         # e2e tests
yarn prisma migrate dev   # create + apply migration (local)
yarn prisma migrate deploy# apply pending migrations (prod)
yarn prisma generate      # regenerate Prisma client
yarn prisma studio        # browse the DB
```
