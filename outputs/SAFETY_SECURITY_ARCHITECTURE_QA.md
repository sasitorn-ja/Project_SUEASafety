# SUEA Safety Security, Cloudinary, Scalability, and QA Notes

Updated: 2026-06-20

## Production Console Logging

- Next.js production builds remove `console.log`, `console.info`, `console.debug`, and `console.trace` through `next.config.mjs`.
- `console.warn` and `console.error` are retained for production diagnostics. The Playwright QA agent fails if browser console errors/warnings leak during tested flows.
- Do not log request bodies, tokens, cookies, SSO payloads, password hashes, or Cloudinary secrets in backend code.

## Network Payload Hardening

- API responses should be DTO-shaped at the backend boundary.
- Upload APIs now return media DTOs only: `id`, `url`, `originalName`, `mimeType`, `sizeBytes`, `status`, `module`, ownership link fields, provider, dimensions, format, and timestamps.
- Raw database fields such as `storage_path`, `provider_asset_id`, `provider_public_id`, `metadata`, `created_by`, and deleted markers are not sent to the browser.
- Post APIs resolve `author_id`, `organization_id`, `team_id`, and `category` server-side from the authenticated session/profile. Frontend payloads are treated as untrusted.

## Sensitive Data Transport

- Keep auth/session state in Secure, HttpOnly, SameSite cookies.
- Do not store bearer tokens, SSO tokens, refresh tokens, Cloudinary secrets, or session secrets in `localStorage`.
- If client-readable state is necessary, store only non-sensitive UI preferences. Local storage currently used by legacy/admin UI should not contain credentials.
- Vercel/hosting env vars must not use `NEXT_PUBLIC_` for secrets.

## Department/Team Logic

- Recommended default: allow a post with no active team, but mark it as `teamScope: "unassigned"`.
- Unassigned posts appear in global feed, but not in `scope=my-team` and not in team rankings.
- Ranking and team dashboard queries should count only rows with a real `team_id`.
- If the business later requires strict policy, enforce `team_required` in `createPost` before insert and guide the user to complete profile/team assignment.

## Large Data Scalability

- Use cursor-based pagination for large feeds: `GET /api/safety-culture/posts?cursor=<last_id>&limit=50`.
- Avoid offset pagination on high-volume tables because late pages scan and sort too much data.
- Keep these indexes current:
  - `posts(status, team_id, id)`
  - `posts(status, category, id)`
  - `posts(author_id, status, id)`
  - `comments(post_id, deleted_at, id)`
  - `reactions(post_id, user_id)`
  - `post_media(post_id, sort_order)` and `post_media(media_asset_id, post_id)`
  - `media_assets(status, deleted_at, created_at, id)`
  - `team_members(user_id, left_at, joined_at, team_id)`
  - `point_balances(balance, user_id)`
- Add Redis cache for dashboard/ranking responses with short TTLs such as 30-120 seconds. Invalidate or refresh after post approval, point transactions, team membership changes, and reward redemptions.

## Cloudinary Upload Flow

1. Frontend optimizes image locally and sends `multipart/form-data` to `POST /api/uploads`.
2. Backend validates MIME type and file size.
3. If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are configured, backend signs and uploads to Cloudinary.
4. Backend stores Cloudinary metadata in `media_assets`.
5. Backend returns a safe media DTO with a public delivery `url`.
6. Frontend sends `attachmentIds` to `POST /api/safety-culture/posts`.
7. Backend inserts `posts`, links `post_media`, and marks media as `LINKED`.
8. Feed queries return `photos[].url` from Cloudinary or local download fallback.

## Deployment Env Vars

Set these in Vercel or the hosting provider's encrypted environment settings:

```text
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_UPLOAD_FOLDER=cpac-safety
MAX_UPLOAD_BYTES=8388608
```

For Vercel, add them under Project Settings -> Environment Variables for Production and Preview as needed. Redeploy after saving.

## CI/CD

Recommended GitHub Actions steps:

```yaml
- run: npm ci
- run: npm run build
- run: npx playwright install --with-deps chromium
- run: npm run qa:e2e
  env:
    PLAYWRIGHT_BASE_URL: http://127.0.0.1:3000
```

For authenticated QA, create a storage state once and provide it through `PLAYWRIGHT_STORAGE_STATE`.

## QA Automation Agent

- Run: `npm run qa:e2e`
- Headed debug: `npm run qa:e2e:headed`
- Reports:
  - `test-results/safety-agent-report.json`
  - `playwright-report/index.html`
- The agent fails immediately when it finds unexpected browser console warnings/errors, page errors, or HTTP 5xx/unexpected 4xx responses.
