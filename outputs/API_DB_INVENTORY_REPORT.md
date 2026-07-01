# API and DB Inventory Report

Generated: 2026-07-01

## API Summary

- Registry definitions verified: `163`
- Unique method + path routes: `163`
- Authoritative full route appendix: [SYSTEM_INVENTORY_SUMMARY.md](/Users/sasitorn/Project_SUEASafety/outputs/SYSTEM_INVENTORY_SUMMARY.md)

### API Count By Module

| Module | Routes |
| --- | ---: |
| Assessment | 8 |
| Assessment Admin | 9 |
| Assistant | 1 |
| Audit | 1 |
| Auth | 4 |
| Awareness | 1 |
| Awareness Admin | 5 |
| Check-in | 8 |
| Corrective Action | 6 |
| Holidays | 3 |
| Locations | 15 |
| Media | 5 |
| Notifications | 7 |
| Organizations | 6 |
| Reports | 8 |
| Rewards Admin | 6 |
| Safety Awareness | 2 |
| Safety Culture | 27 |
| Safety Culture Admin | 6 |
| Safety Effort | 15 |
| Settings | 2 |
| System | 2 |
| Uploads | 5 |
| Users/IAM | 11 |

### Important API Notes

- Public or semi-public operational probes: `/api/health`, `/api/version`, auth entrypoints
- Most business APIs are protected and correctly return `401` when called without session
- Frontend literal API references found in repo audit: `51`
- Mock/demo references in production-readiness audit: `0`

## DB Summary

- Authoritative database: `CPAC_Safety`
- Verified live table count: `46`
- Authoritative full table appendix: [SYSTEM_INVENTORY_SUMMARY.md](/Users/sasitorn/Project_SUEASafety/outputs/SYSTEM_INVENTORY_SUMMARY.md)

### Full Table List With Purpose Summaries

| Table | Purpose |
| --- | --- |
| `api_docs_access_users` | Allowlist for API Docs / OpenAPI access |
| `archived_notifications` | Notifications the user archived |
| `assessment_answers` | Answer rows under each assessment run |
| `assessment_attachments` | File attachments for assessment runs |
| `assessment_questions` | Checklist questions for assessment templates |
| `assessment_runs` | Assessment / Linewalk / Safety Contact runs |
| `assessment_templates` | Assessment template headers |
| `audit_logs` | Important system audit trail |
| `awareness_answers` | Individual Safety Awareness answers |
| `awareness_attempts` | Safety Awareness attempt headers |
| `awareness_questions` | Safety Awareness question bank |
| `checkin_attachments` | Attachments linked to check-ins |
| `checkins` | Selected and actual check-in location snapshots |
| `comment_reactions` | Reactions on comments |
| `comments` | Safety Culture comments |
| `corrective_action_comments` | Comments on corrective action tasks |
| `corrective_actions` | Corrective action tasks |
| `export_jobs` | Export/report job queue and snapshots |
| `holidays` | Holiday calendar rows |
| `locations` | CPAC_Safety-managed locations and snapshots |
| `media_assets` | Uploaded media metadata |
| `notification_preferences` | Per-user notification settings |
| `notifications` | User notification inbox |
| `organizations` | Organization tree / structure |
| `permissions` | Permission catalog |
| `point_balances` | Current point/Coin balances |
| `point_rules` | Point rule definitions |
| `point_transactions` | Point/Coin transaction ledger |
| `post_media` | Post-to-media relation table |
| `posts` | Safety Culture posts |
| `reactions` | Reactions on posts |
| `reward_inventory_transactions` | Reward stock movements |
| `reward_redemptions` | Reward redemption history |
| `rewards` | Reward catalog |
| `role_permissions` | Role-to-permission relations |
| `roles` | Role definitions |
| `safety_activities` | Safety activity records |
| `safety_culture_events` | Safety Culture events/campaigns |
| `safety_effort_submissions` | Real Linewalk / Safety Contact submissions |
| `safety_findings` | Safety findings/issues |
| `safety_old` | Legacy safety summary source |
| `safety_settings` | Central settings/config values |
| `team_members` | Safety Culture team membership |
| `teams` | Safety Culture teams |
| `user_roles` | User-to-role relations |
| `users` | User accounts and SSO-linked profiles |

## Current DB Mismatch Highlights

- `LOCATION_HUB_DATABASE_URL` missing -> master locations do not come from the intended live source
- `locations` has only `4` rows -> too small for a real master-location driven workflow
- `organizations` has `0` rows -> org features are structurally present but not populated
- `assessment_runs` has `0` rows -> assessment subsystem exists but is not operationally populated
- `corrective_actions` has `0` rows -> corrective workflow not active in real data yet

## Recommended Reading Order

1. [PRODUCTION_DEPLOY_RUNBOOK.md](/Users/sasitorn/Project_SUEASafety/outputs/PRODUCTION_DEPLOY_RUNBOOK.md)
2. [LIVE_SYSTEM_AUDIT.md](/Users/sasitorn/Project_SUEASafety/outputs/LIVE_SYSTEM_AUDIT.md)
3. [SYSTEM_INVENTORY_SUMMARY.md](/Users/sasitorn/Project_SUEASafety/outputs/SYSTEM_INVENTORY_SUMMARY.md)

