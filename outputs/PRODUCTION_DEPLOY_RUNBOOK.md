# Production Deploy Runbook

Generated: 2026-07-01

## Target

- Production URL: `https://safety.cipcloud.net`
- App host: `root@192.168.1.142`
- App directory: `/var/www/cpac-safety-plus`
- Deploy branch: `main`
- Database: `CPAC_Safety` on `192.168.1.196:3306`

## Canonical Deploy Flow

Source of truth is [`scripts/deploy-production.sh`](/Users/sasitorn/Project_SUEASafety/scripts/deploy-production.sh).

1. SSH to `root@192.168.1.142`
2. `cd /var/www/cpac-safety-plus`
3. `git fetch origin main`
4. `git reset --hard origin/main`
5. Verify `.env.production` exists on server
6. `docker compose --profile tools build`
7. `docker compose --profile tools run --rm migration`
8. `docker compose up -d --force-recreate`
9. Check `https://safety.cipcloud.net/api/health`

## Prerequisites

- `origin/main` must contain the code intended for production
- Server must have `.env.production`
- Docker Compose must be available on host
- Database `CPAC_Safety` must be reachable from container
- `APP_BASE_URL`, SSO settings, `DATABASE_URL`, and `APP_SESSION_SECRET` must be set

## Verified Runtime Config

- `DATABASE_URL`: set
- `APP_BASE_URL`: set
- `SSO_ISSUER`: set
- `APP_SESSION_SECRET`: set
- `LOCATION_HUB_DATABASE_URL`: missing

## Deploy Executed

Executed on 2026-07-01 against the real production target.

- Local `HEAD`: `0c8016e85778251908817aed4311d3e98ccb6a07`
- `origin/main`: `0c8016e85778251908817aed4311d3e98ccb6a07`
- Remote deployed repo `HEAD`: `0c8016e85778251908817aed4311d3e98ccb6a07`

Observed result:

- Docker build completed
- Migration container completed successfully
- App container recreated successfully
- Health probe briefly returned `502` during warm-up immediately after container start
- Follow-up health checks returned stable `200 OK`

## Important Limitation

This deploy path always ships `origin/main` from the remote server checkout.

Current local workspace had uncommitted changes during this run, so those local-only edits were **not** included in production. To deploy the latest local dashboard/backend changes, they must be committed and pushed to `origin/main` first, or deployed through an explicitly different release process.

## Post-Deploy Verification

- `GET /api/health` -> `200 OK`, database connected
- `GET /api/version` -> `200 OK`
- App responds behind nginx after warm-up

