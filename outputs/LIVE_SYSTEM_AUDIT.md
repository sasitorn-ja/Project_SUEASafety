# Live System Audit

Generated: 2026-07-01

## Executive Summary

- Production URL `https://safety.cipcloud.net` is up
- Production app is connected to `CPAC_Safety`
- Canonical deploy flow works on the real target
- Core protected APIs are alive and returning expected unauthenticated `401` responses
- Main operational risk is not API absence, but incomplete runtime/master-data wiring and a few scale gaps

## Production Wiring Verification

- `GET /api/health` -> `200 OK`
- `GET /api/version` -> `200 OK`
- `GET /api/auth/session` -> `200 OK`, unauthenticated payload
- `GET /api/safety-effort/reports/linewalk-overview` -> `401 unauthorized` without session, expected for protected route
- `GET /api/safety-culture/posts?limit=1` -> `401 unauthorized` without session, expected for protected route
- `GET /api/safety-settings?key=safety_awareness_enabled` -> `401 unauthorized` without session, expected for protected route

## Database Verification

- `.env.production` points to `CPAC_Safety`
- Live health check reports database connected
- `CPAC_Safety` table count verified live: `46`

Critical live table counts:

| Table / Area | Count | Audit note |
| --- | ---: | --- |
| `users` | 10 | Small live user base |
| `notifications` | 269 | Active in production |
| `posts` | 41 | Safety Culture is in real use |
| `rewards` | 6 | Reward catalog exists |
| `safety_effort_submissions` | 59 | Safety Effort is DB-backed and live |
| `locations` | 4 | Too small for true master-location expectations |
| `organizations` | 0 | Org tree feature is structurally present but not populated |
| `assessment_runs` | 0 | Assessment subsystem exists but is not populated operationally |
| `corrective_actions` | 0 | Corrective action workflow is not active in DB |

## Current Gaps By Page / Module

Highest-value weak areas from the current production-readiness audit:

| Page / Module | Current | Issue |
| --- | ---: | --- |
| `/profile/activity-history` | 72% | Loads first 100 transactions only; needs proper cursor/load-more |
| `/safety-culture/admin-leaderboard` | 70% | User/team selection needs permission and scale hardening |
| `/safety-culture/admin-reward` | 75% | Runtime image/upload audit still needed |
| `/safety-culture/admin-event` | 78% | Event API exists, but notification/write audit is still weak |
| Safety Effort pages (`/activity`, `/assessment-summary`, `/checkin`, `/linewalk`, `/safety-contact`) | 82-84% | Real APIs are in place, but master-data scale and UX hardening remain |

## Confirmed Backlog Findings

### P1

- `LOCATION_HUB_DATABASE_URL` is not configured in production
- Impact: Plant/Office/Site master data falls back to `CPAC_Safety.locations` admin rows instead of the intended live master source

### P2

- Linewalk and location admin still request very large payloads (`pageSize=1000`) for plants/organizations
- Admin leaderboard can request too many users in one response
- Profile activity history lacks scalable pagination/load-more

## Operational Mismatches

- UI expects richer location master data than the `locations` table currently contains
- IAM/org features exist structurally, but `organizations` is empty
- Corrective action UX exists conceptually, but `corrective_actions` is empty
- Assessment run tables exist, but `assessment_runs` is empty
- Production is functional, but some admin/reporting pages are only partially operational at scale

## Conclusion

Production is correctly wired to the real app and real database, and the current deploy path works. The main missing pieces are:

1. live master-location connection,
2. scale-safe pagination/search on several admin and Safety Effort screens,
3. activation/population of some operational tables that the UI already anticipates.

