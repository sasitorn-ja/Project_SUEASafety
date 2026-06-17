# Backend Structure

Backend code lives under `backend/components`. API route files in `src/app/api`
should stay thin: validate HTTP input, call a backend component, then return a
response.

## Components

- `components/core`: shared backend infrastructure such as API response helpers,
  session guards, database pool, query helpers, and transactions.
- `components/auth`: SSO/OIDC flow, session cookies, and session hydration.
- `components/users`: user repository, SSO user upsert, roles, permissions, and
  session user mapping.
- `components/api-catalog`: generated API inventory registry and catch-all route
  dispatcher for target API contracts that do not have a dedicated route yet.
- `components/points`: shared safety point rules used by backend APIs and
  frontend scoring flows.
- `components/safety-effort`: Safety Effort domain logic. Split future work by
  business capability, for example `locations`, `checkins`, `assessments`,
  `reports`, and `media`.

## Rules

- Do not put business logic directly in `src/app/api/**/route.ts`.
- Do not store uploaded production images as base64 in DB payloads.
- Keep repositories close to their domain component and use `components/core/db`
  for database access.
- Add new backend features as focused component folders instead of one large
  shared file.
