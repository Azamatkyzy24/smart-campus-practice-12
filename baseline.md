# Practice #12 — Task #01: Frozen baseline (code-based)

## Version
- Project: Smart Campus Room Availability Checker (Bolt.new project `sb1-zwdhwzpa`)
- Stack: React 18 + TypeScript 5.5 + Vite 7 + Tailwind 3, tests with Vitest 3.2.4
- Snapshot date: 24 Nov 2026 (state after Practice #11)
- Baseline commit: `d888feb` in https://github.com/Azamatkyzy24/smart-campus-practice-12
- Rule engine: `src/lib/checkAvailability.ts` (pure function `checkAvailability` + `parseInput`)

## Booking data (fictional)
- Room: A-101, lecture room, capacity 40
- Room blocked: `false` by default (checkbox in UI)
- Current time ("now"): 540 min = 09:00 (editable)
- Existing bookings: one booking, 600–660 min (10:00–11:00), read-only
- Time unit: whole minutes after midnight, allowed range 0–1440

## Expected behavior (as implemented now)
Checks run in this order:

| Order | Condition | status | reasonCode |
|---|---|---|---|
| 1 | Room blocked | unavailable | ROOM_BLOCKED |
| 2 | start / end / now empty or not whole number | invalid | INVALID_INPUT |
| 3 | now < 0 or now > 1440 | invalid | INVALID_TIME |
| 4 | start >= end (zero or negative duration) | invalid | INVALID_TIME |
| 5 | start or end < 0, or end > 1440 | invalid | INVALID_TIME |
| 6 | start <= now (past) | unavailable | PAST_TIME |
| 7 | end − start > 120 | unavailable | DURATION_TOO_LONG |
| 8 | overlaps a booking (touching endpoints allowed) | unavailable | OVERLAP |
| 9 | otherwise | available | AVAILABLE |

Bookings are never changed by a check.

## Existing checks (run on 24 Nov 2026)
- `npm test` → 22 passed, 0 failed (1 test file)
- `npm run typecheck` → no errors
- `npm run lint` → no errors

## Differences from the Practice #12 contract (recorded, NOT changed)
1. Input is start + end, not start + duration. Duration = end − start.
2. Past start (T6) and duration 121 (T5) return `unavailable`, but Practice #12 expects a validation error. Duration 0 (T4) already returns `invalid`.
3. "Room blocked" is checked first, so a blocked room with bad input shows "blocked" rather than a validation error.
4. AC numbers differ: in AGENTS.md AC3 = blocked and AC4 = overlap; in Practice #12 AC3 = overlap and AC4 = blocked.
5. `@supabase/supabase-js` is listed as a dependency but is not used (relevant for the Task #07 SCA review).
