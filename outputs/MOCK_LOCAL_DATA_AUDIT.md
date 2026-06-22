# Mock / Local Data Audit

Updated: 2026-06-19

## Important Finding

The API catalog exists and many backend routes are real, but several frontend pages still seed or read data from `localStorage`, JSON mock files, or default in-memory state. That is why the system can look like it has API routes while some screens still show simulated data.

## Must Replace With Real API

| Area | File | Current mock/local source | Impact |
|---|---|---|---|
| Safety Admin manage data | `src/features/safety-effort/screens/SafetyAdminManageData.tsx` | `mock_plants.json`, `mock_offices.json`, `mock_sites.json`, `localStorage` | Plant/office/site admin data can diverge from DB/API. |
| Safety Admin report history | `src/features/safety-effort/screens/SafetyAdminReportHistory.tsx` | Seeded mock submissions and `suea-safety-submissions-v1` | Report history is not authoritative. |
| Safety Admin export report | `src/features/safety-effort/screens/SafetyAdminExportReport.tsx` | `mock_excel_records.json`, local submissions, default profile | Export can include template/mock records. |
| Assessment summary submit | `src/features/safety-effort/screens/AssessmentSummary.tsx` | `suea-safety-submissions-v1`, local profile defaults | Submitted assessment is stored in browser, not central DB. |
| Safety Admin role | `src/features/safety-effort/screens/SafetyAdminRole.tsx` | `suea-safety-users-v1` | Role page can show browser-only user data. |
| Safety Admin date/settings UI | `src/features/safety-effort/screens/SafetyAdmin.tsx` | `safety_backdate_*`, `safety_allowed_*` localStorage | Some settings are local while checklist settings use API. |

## Partially API-Backed / Seed Fallback

| Area | File | Current behavior | Recommendation |
|---|---|---|---|
| Safety Culture provider state | `src/providers/app-providers.tsx` | Defaults are initialized first, then backend replaces when authenticated. | Keep empty defaults for UX, but avoid showing fake business data after authenticated API fails. |
| Reward categories | `src/lib/safety-culture.ts`, `src/providers/app-providers.tsx` | Default category config remains local. | Persist reward categories/settings in API. |
| Awareness questions | `src/lib/safety-awareness.ts`, `src/providers/app-providers.tsx` | Seed questions are fallback if API has none/fails. | Treat seed as bootstrap only; admin page should clearly save to DB. |
| Menu config | `src/lib/menu-config.ts` | Admin-customized menu stored in localStorage. | If menu must be shared across users, move to API. |
| Demo login | `src/lib/session-user.ts`, `src/features/safety-effort/screens/Login.tsx` | Localhost demo only. | Acceptable for local development; not production data. |

## Already API-Backed Core Routes

| Area | Route |
|---|---|
| Safety Culture posts | `GET/POST /api/safety-culture/posts` |
| Safety Culture post comments/reactions | `/api/safety-culture/posts/:id/comments`, `/api/safety-culture/posts/:id/reactions` |
| Uploads/media | `/api/uploads` |
| Points/leaderboard/team list | `/api/safety-culture/points/*`, `/api/safety-culture/leaderboard`, `/api/safety-culture/teams` |
| Users/roles/organizations | `/api/users`, `/api/roles`, `/api/organizations` |
| Locations/checkins | `/api/locations/*`, `/api/checkins*` |
| Notifications | `/api/notifications*` |
| Safety settings | `GET/PUT /api/safety-settings` |

## Recommended Cleanup Order

1. Replace `SafetyAdminManageData.tsx` mock JSON/localStorage with `/api/locations/*`.
2. Replace `AssessmentSummary.tsx` local submission write with assessment/report API.
3. Replace `SafetyAdminReportHistory.tsx` with DB-backed report list/detail.
4. Replace `SafetyAdminExportReport.tsx` with server export job/API and remove `mock_excel_records.json` from runtime.
5. Persist admin settings currently using `safety_backdate_*` localStorage.
6. Persist reward categories/ranking config if it must be shared across users.
