# SUEA Safety API Connection Audit

Updated: 2026-06-19

## Summary

| Area | Status | Notes |
|---|---|---|
| Safety Culture feed | Connected | `GET /api/safety-culture/posts` returns real posts, categories, team/org, points, and `photos[].url`. Frontend now maps those fields instead of hardcoding photos/category. |
| Safety Culture create post | Connected | Frontend uploads images first, sends `attachmentIds`, awaits `POST /api/safety-culture/posts`, and only shows success after server response. |
| Safety Culture My Team | Connected | Uses `scope=my-team` from backend. If a user has no active team, API returns an empty list instead of fake `post.isYou` data. |
| Uploads/media | Connected with fallback | Backend stores to Cloudinary when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` exist; otherwise uses `UPLOAD_DIR` local fallback. |
| Team leaderboard | Connected | `GET /api/safety-culture/teams` now includes summed member `point_balances` as team points. Users without a team keep personal points only. |
| Safety settings/checklists | Connected | Frontend uses `GET/PUT /api/safety-settings`; `POST /api/safety-settings` is not used. |
| Notifications | Connected | Inbox/read/read-all routes use API; scale indexes added for user/read pagination. |
| Check-in and locations | Connected/partially connected | Core check-in/location screens call API. Large read paths still need continued cursor/bbox enforcement for very large datasets. |
| Safety Admin manage data | Local/mock | `SafetyAdminManageData.tsx` still uses mock/local data. Needs real CRUD/list APIs before marking complete. |
| Safety Admin report history | Local/mock | Uses local submissions store. Needs DB-backed report list/detail. |
| Safety Admin export report | Local/mock | Uses local submissions and `mock_excel_records.json`. Needs server export job/API. |
| Safety Culture comments/reactions | Partially connected | Backend routes exist and frontend calls them, but UI still does optimistic mutation without full rollback on API failure. |
| Reward categories/personal rankings | Partially connected | Reward catalog/redeem API-backed; some category/ranking UI state remains local-derived. |
| We're OK read/list flows | Partially connected | Write-oriented routes exist; list/detail/report flows still need full API-backed refresh behavior. |

## Safety Culture Post Flow

| Step | API/table | Current behavior |
|---|---|---|
| Upload image | `POST /api/uploads` -> `media_assets` | Returns `media.id`; provider is `cloudinary` when env is complete, otherwise `local`. |
| Create post | `POST /api/safety-culture/posts` -> `posts`, `post_media`, `point_transactions` | Server stamps `organization_id`, `team_id`, `category`, `event_id`, `points_awarded`; frontend uses server post. |
| Reload feed | `GET /api/safety-culture/posts?scope=all` | Other users see published posts from DB with image URLs. |
| My team | `GET /api/safety-culture/posts?scope=my-team` | Returns only same active team. No team means empty state, not fake data. |
| Points | `point_balances`, `point_transactions` | Personal points always apply; team points only derive from active `team_members`. |

## Scale Readiness Added

| Table | Index coverage |
|---|---|
| `posts` | status/deleted/id, author/status/id, existing team/category feed indexes |
| `comments` | post/deleted/id |
| `reactions` | post/user |
| `post_media` | media/post and existing post/order |
| `media_assets` | status/deleted/created, created_by/created_at, provider/provider_asset |
| `checkins` | user/time/id, location/time/id |
| `locations` | type/status/deleted, checkin/status/deleted |
| `notifications` | user/id, user/read/id |
| `rewards`, `reward_redemptions` | status/points, user/id |
| `awareness_attempts` | user/date/id |
| `team_members`, `point_balances` | active team lookup and leaderboard |

## Remaining Backlog Before Saying “All Menus Fully API”

| Priority | Work |
|---|---|
| P0 | Replace Safety Admin manage-data local/mock with real API. |
| P0 | Replace Safety Admin report-history/export-report local/mock with DB-backed report/export APIs. |
| P1 | Add rollback/error UI for optimistic comment/reaction mutations. |
| P1 | Persist reward categories and personal ranking configuration. |
| P1 | Finish We're OK read/list/report API flows. |
| P2 | Move remaining high-growth generic `OFFSET + COUNT(*)` list endpoints to cursor/keyset and use `includeTotal=true` only where needed. |
