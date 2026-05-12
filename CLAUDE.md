# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

In this project used yarn as package manager

```bash
yarn run start:dev                      # Dev with hot reload
yarn run build                          # Compile TypeScript
yarn run lint                           # ESLint with auto-fix
yarn run format                         # Prettier
yarn run test                           # Unit tests
yarn run test:e2e                       # e2e tests (test/jest-e2e.json)
jest --testPathPattern=auth            # Single file by pattern
yarm prisma migrate dev                 # Run migrations (dev)
yarm prisma migrate deploy              # Run migrations (prod)
yarm prisma generate                    # Regenerate client → src/generated/prisma/
```

After any change: `yarn run lint && npx tsc --noEmit`

---

## Architecture

NestJS REST API — chat app with JWT auth, PostgreSQL via Prisma, email verification.

**Global guards** (every route, opt out via `@Public()`):
- `JwtAuthGuard` — validates JWT from `httpOnly` cookies
- `VerifiedGuard` — blocks unverified users

**Auth flow**: `accessToken` + `refreshToken` in `httpOnly` cookies (not response body). Refresh tokens are bcrypt-hashed in DB. `@Authorized('field')` extracts fields from `req.user`.

**Auth providers** (model for splitting by responsibility, not by entity):
`AuthService` · `RegistrationService` · `PasswordService` · `OauthService` · `JwtTokenService` · `CookieService` · `BcryptService` · `VerificationTokenService`

**Prisma**: client → `src/generated/prisma/`. `PrismaService` uses `@prisma/adapter-pg`. After schema changes: `prisma migrate dev` → `prisma generate`.

**Mail**: `MailService` via nodemailer. Links point to `CLIENT_URL` (frontend) — frontend calls the API to complete verification.

**Config**: env vars validated with Zod at startup (`src/config/env.validation.ts`). Use `ConfigService<AppConfigInterface>` + `configService.getOrThrow(...)`.

---

## Structure

```
src/
  modules/<feature>/
    dto/           # One DTO file per operation; named <Action><Entity>Dto
    interfaces/    # Types scoped to this module
    <feature>.controller.ts / .service.ts / .module.ts
    # Split into multiple services when responsibilities diverge (see Auth)
  common/
    decorators/ guards/ filters/ interceptors/ pipes/
  config/          # Env validation, config interfaces
  generated/prisma/ # DO NOT EDIT — auto-generated
```

New feature = new module under `src/modules/`. No feature logic in `AppModule`.

---

## Behaviour Principles

### 1 · Think Before Coding
- State assumptions explicitly — If uncertain, ask rather than guess
- Present multiple interpretations — Don't pick silently when ambiguity exists
- Push back when warranted — If a simpler approach exists, say so
- Stop when confused — Name what's unclear and ask for clarification

### 2 · Simplicity First
- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- No error handling for impossible scenarios
- If 200 lines could be 50, rewrite it

### 3 · Surgical Changes
- Touch only what the request requires. Don't "improve" adjacent code, formatting, or comments.
- Match existing style even if you'd do it differently.
- Remove imports/variables/functions made unused **by your changes**. Don't touch pre-existing dead code unless asked — mention it instead.

### 4 · Goal-Driven Execution
- For bug fixes: write a failing test first, then make it pass.
- For multi-step tasks, state a brief plan with a verify step for each: `[Step] → verify: [check]`
- Don't mark a task done until the verify step passes (`lint`, `tsc`, tests).

---

## SOLID & OOP

- **SRP**: one concern per service. >3 injected deps = signal to split. Controllers only validate + delegate.
- **OCP**: extend via new classes or NestJS mechanisms (guards, interceptors, pipes) — don't modify stable services.
- **LSP**: implement interfaces fully. Never return `null` where an object is promised — throw a typed exception.
- **ISP**: small, consumer-scoped interfaces in `interfaces/`. No fat interfaces.
- **DIP**: depend on abstractions (interfaces, injection tokens). Never `new SomeService()` — use NestJS DI. Use custom tokens for infrastructure concerns (mail, storage).

---

## Code Style

- No `any`. Use `unknown` with narrowing if genuinely unknown.
- `async/await` only — no `.then()` chains.
- Throw NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.). Never swallow errors silently.
- DTOs on every request body with `class-validator`. Named `<Action><Entity>Dto`.
- No magic strings/numbers — use constants or enums.
- Path aliases only — no deep relative imports (`../../../`).

---

## Testing

- Spec files beside the source: `users.service.spec.ts` next to `users.service.ts`. e2e in `test/`.
- Mock all dependencies. Never hit real DB or mail in unit tests.
- `describe` = one class · `it` = one behaviour · name: `'should X when Y'`
- Cover: happy path + every thrown exception + business-logic edge cases.

---

## Hard Rules

- **Never edit `src/generated/prisma/`** — overwritten by `prisma generate`.
- **Never modify existing migration files** — create a new one.
- **Never bypass guards** with `any` or `@ts-ignore`.
- **Never commit `.env` or secrets** — add to `.env.example` instead.
- **Never add business logic to a controller**.
- **Never instantiate services with `new`** — use NestJS DI.

---

## Environment Variables

```
DATABASE_URL, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
JWT_SECRET, JWT_ACCESS_TOKEN_TTL, JWT_REFRESH_TOKEN_TTL   # e.g. "15m", "7d"
COOKIE_DOMAIN, CLIENT_URL
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
NODE_ENV   # development | production | staging
```
