# Production Readiness Audit

Generated: 2026-07-01T10:50:32.797Z

## Overall

- Current readiness: **84%**
- Target after backlog: **92%**
- Database: **CPAC_Safety on 192.168.1.196**
- Scoring weights: api 25%, db 25%, network 20%, mock 10%, security 10%, ux 10%

## Module Scores

| Module | Current | Target |
|---|---:|---:|
| Home | 90% | 95% |
| Safety Effort | 83% | 90% |
| API Docs | 88% | 95% |
| Dashboard | 82% | 92% |
| Unscored | 90% | 90% |
| Notifications | 84% | 92% |
| Profile | 76% | 94% |
| Safety Admin | 86% | 93% |
| Safety Culture | 86% | 93% |
| Culture Admin | 80% | 93% |
| IAM | 86% | 92% |

## Page Scores

| Page | Module | Current | Target | Notes |
|---|---|---:|---:|---|
| `/` | Home | 90% | 95% | Global post/comment hydration removed; home no longer preloads Safety Culture comments. |
| `/activity` | Safety Effort | 82% | 90% | Wizard steps pass state locally and persist through the final Safety Effort submissions API. |
| `/api-docs` | API Docs | 88% | 95% | API docs access is gated and RBAC permissions are seeded in CPAC_Safety. |
| `/assessment-summary` | Safety Effort | 82% | 90% | Wizard steps pass state locally and persist through the final Safety Effort submissions API. |
| `/category` | Safety Effort | 84% | 92% | Monthly count now requests pageSize=1 and uses API total instead of loading 500 submissions. |
| `/checkin` | Safety Effort | 82% | 90% | CPAC_Safety.locations has active, check-in-enabled rows referenced by real check-ins. |
| `/create-post` | Safety Effort | 84% | 90% | Create flow uses upload and post APIs; runtime media QA remains the main residual risk. |
| `/dashboard` | Dashboard | 82% | 92% | Dashboard reads real report APIs; load-test script added for concurrent smoke/regression checks. |
| `/dashboard-safety-effort` | Unscored | 90% | 90% | Redirect-only compatibility route; no extra data hydration. |
| `/linewalk` | Safety Effort | 82% | 90% | CPAC_Safety.locations has active, check-in-enabled rows referenced by real check-ins. |
| `/login` | Unscored | 90% | 90% | Production login uses SSO; demo login is disabled in production builds. |
| `/notifications` | Notifications | 84% | 92% | Notification bootstrap limit reduced to 30; post previews remain route-loaded. |
| `/profile` | Profile | 80% | 95% | Profile uses user + ranking data; route-loaded leaderboard applies. |
| `/profile/activity-history` | Profile | 72% | 92% | Activity history should be paginated if it grows. |
| `/safety-admin` | Safety Admin | 85% | 95% | Checklist/backdate are DB-backed. |
| `/safety-admin/export-report` | Safety Admin | 88% | 92% | Export creates export_jobs rows and downloads from the stored job snapshot. |
| `/safety-admin/manage-data` | Safety Admin | 84% | 90% | CPAC_Safety.locations has active, check-in-enabled rows referenced by real check-ins. |
| `/safety-admin/report-history` | Safety Admin | 86% | 95% | Mock fallback removed and initial report history payload reduced to 50 submissions. |
| `/safety-contact` | Safety Effort | 82% | 90% | Wizard steps pass state locally and persist through the final Safety Effort submissions API. |
| `/safety-culture` | Safety Culture | 90% | 95% | Initial feed is 15 posts, cursor loads 15 more, comments are lazy-loaded. |
| `/safety-culture/admin-awareness` | Culture Admin | 82% | 95% | Awareness question/settings are DB-backed. |
| `/safety-culture/admin-event` | Culture Admin | 78% | 92% | Event API exists; notification/write audit needed. |
| `/safety-culture/admin-leaderboard` | Culture Admin | 70% | 92% | Team/admin user selection needs permissions and scale audit. |
| `/safety-culture/admin-points` | Culture Admin | 94% | 95% | All required point rules are present in CPAC_Safety.point_rules. |
| `/safety-culture/admin-reward` | Culture Admin | 75% | 92% | Reward categories are settings-backed; image/upload audit needed. |
| `/safety-culture/admin-users` | IAM | 86% | 92% | Base permissions and role_permissions are seeded; user assignment workflow remains the scale/security audit item. |
| `/safety-culture/leaderboard` | Safety Culture | 82% | 92% | Leaderboard is route-loaded and no longer hydrated globally. |
| `/safety-culture/post` | Safety Culture | 84% | 92% | Create flow uses upload and post APIs; runtime media QA remains the main residual risk. |
| `/safety-culture/posts/[postId]` | Safety Culture | 88% | 95% | Post detail loads one post and first 30 comments, not 100 comments. |
| `/safety-culture/rewards` | Safety Culture | 84% | 92% | Rewards are route-loaded; stock/balance enforcement stays on the backend redeem API. |

## Findings

| Severity | Area | Finding |
|---|---|---|
| - | - | No critical findings from static/DB audit. |

## API / Mock Coverage

- App routes found: 30
- Frontend literal API references: 54
- Mock/demo references found: 0

## DB Critical Summary

- Tables: 46
- Point rules in DB: commentCreated, reactionCreated, safetyAwarenessCompleted, safetyEffortCompleted, safetyPostApproved
- role_permissions rows: 10
- safety_effort_submissions rows: 59
- export_jobs rows: 1
