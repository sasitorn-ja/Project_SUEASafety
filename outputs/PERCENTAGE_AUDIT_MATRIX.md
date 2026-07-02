# Percentage Audit Matrix

## Scope

This matrix covers user-visible percentage and progress metrics in the Safety Awareness flow, dashboard, and leaderboard surfaces. It excludes CSS-only `%` layout values.

## Canonical Rules

- Frontend runtime source of truth for Safety Awareness state lives in `/Users/sasitorn/Project_SUEASafety/frontend/src/providers/app-providers.tsx`.
- Shared required-day/date-window logic lives in `/Users/sasitorn/Project_SUEASafety/frontend/src/lib/safety-awareness.ts`.
- Backend attempt `score` is stored as a percent in `/Users/sasitorn/Project_SUEASafety/backend/components/safety-awareness/repository.ts`.
- Quiz result copy must present correct-answer count separately from participation percentage.

## Audit Table

| Bucket | Surface | User-visible label | Current source | Formula / meaning | Exclusions / time basis | Canonical owner | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Safety Awareness | Gate popup | Progress bar (`x/3`) | Local gate state | `answeredCount / quiz.length` | Current popup attempt only | Gate UI | This is quiz progress, not participation. Safe to stay local. |
| Safety Awareness | Gate popup footer | Quiz result copy | Provider history + gate answers | Correct answers count for the attempt | Current day attempt | Provider + gate UI copy | Copy changed to show correct answers, not Coin. |
| Safety Awareness | Provider runtime | `awarenessDoneToday` | Provider | `awarenessDoneDate === today || awarenessHistory.some(item.date === today)` | Same Bangkok day | Provider | Intentionally treats same-day legacy attempts as complete even if answers array is empty. |
| Safety Awareness | Provider runtime | `awarenessRequiredToday` | Provider + shared helper | `isAwarenessRequiredNow(now, rules)` | Excludes disabled system, out-of-range dates, non-configured weekdays, holidays, out-of-window time | Provider | This is the gate/assistant/dashboard source of truth. |
| Safety Awareness | Dashboard home | `วันนี้: ทำแล้ว / ยังไม่ได้ทำ / ไม่นับ` | Provider | Reads `awarenessRequiredToday` + `awarenessDoneToday` | Today only | Provider consumed by dashboard | Must match gate state exactly. |
| Safety Awareness | Dashboard home | Participation percentage | Dashboard derived from provider data + shared helper | `pastDone / pastRequiredDays * 100` rounded to integer | Required past days only; excludes holidays, out-of-window days, disabled weekdays, pre-start/post-end dates, days before user start date | Provider rules + dashboard presentation | Dashboard now uses shared required-day helper instead of local weekend assumptions. |
| Safety Awareness | Dashboard home | `done`, `missed`, streak | Dashboard derived from provider data + shared helper | Count of required past days completed / not completed; streak across required days only | Same denominator contract as participation | Provider rules + dashboard presentation | Prevents KPI drift when settings toggle mid-day. |
| Safety Awareness | Floating assistant | Reminder urgency | Provider | Warn only when `awarenessRequiredToday && !awarenessDoneToday` | Today only | Provider consumed by assistant | No warning on holidays, excluded weekdays, or outside active hours. |
| Safety Awareness | Admin Awareness page | Status badge (`เปิดใช้งาน`, `รอวันเริ่ม`, `หมดเขต`, `ไม่นับวันนี้`, `นอกเวลา`) | Admin UI + shared helper | Mirrors runtime requirement rules using current settings | Today only, using configured weekdays/holidays/date window/time window | Shared helper | Summary aligns admin preview with runtime screens. |
| Quiz score | Backend attempt payload | `score` in attempts API | Backend repository | `(correctAnswers / totalQuestions) * 100` | Single attempt | Backend | Frontend should not present this number as participation percentage. |
| Quiz score | Provider normalized history | `AwarenessCompletion.score` | Provider serializer | Rounded integer percent from backend payload | Single attempt | Provider | Stored for history; UI result copy should still use correct-count fraction when available. |
| Leaderboard / Team progress | Provider team standings | `team.percent` | Provider | `round((team.points / highestPoints) * 100, 1)` | Current standings snapshot | Provider | Data contract normalized for demo and API-fed data. No minimum visible floor in data. |
| Leaderboard / Team progress | Community / leaderboard UI | Team cards | Provider team standings | Current UI shows points/rank only | Current standings snapshot | Provider | `team.percent` is available for any future bars/tooltips; numeric contract is now consistent. |
| Dashboard progress indicators | Safety Awareness KPI card | Progress bar width | Dashboard completion rate | Uses same integer participation percent as label | Required past days only | Dashboard using provider rules | Label and width intentionally share one percentage value now. |

## Findings

1. Safety Awareness had the highest drift risk because several screens recomputed required days locally with hardcoded weekday assumptions.
2. The biggest semantic mismatch was quiz score vs participation percentage. They now need to stay separate concepts in copy and logic.
3. Leaderboard percent had mixed behavior before: raw ratio in some paths and minimum visible bar logic in others. The provider contract is now raw normalized percentage only.
4. Admin wording previously implied fixed weekend exclusions. Runtime actually supports configurable `awarenessWeekdays`, so admin summaries now need to reflect configured workdays.

## Normalization Decisions

- Safety Awareness requirement logic is centralized around shared helpers plus provider-owned runtime state.
- Same-day completion wins over missing legacy answer rows.
- Participation denominator excludes non-required days consistently.
- Leaderboard `percent` represents data percentage only, not a visual minimum width.
- Visual embellishments, if reintroduced later, should use a separate `visualPercent` or render-only transform rather than mutating the data percent shown to users.

## Follow-up Watchlist

- If a future leaderboard bar is added, keep numeric text/tooltips on `team.percent` and handle minimum bar width in presentation only.
- If admin gets weekday-edit controls later, reuse the same helper-backed rules and update this matrix rather than duplicating formulas.
