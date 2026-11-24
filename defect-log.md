# Defect Log — Task #01

## Baseline
- Tests: 3 passed
- Typecheck: no visible errors
- Build: successful

## BUG-A: Interval overlap
- Test ID: BUG-A-01
- Input: One booking ends exactly when another starts
- Expected: Available; touching endpoints are not a conflict
- Actual: Pending reproduction
- Suspected cause: Incorrect boundary comparison

## BUG-B: Original bookings mutation
- Test ID: BUG-B-01
- Input: Run availability check with an existing bookings array
- Expected: Original bookings array remains unchanged
- Actual: Pending reproduction
- Suspected cause: In-place modification of the array

## Task #02 — Explain availability (mock)

## Change summary
- Added `reasonCode` to every `checkAvailability` return path. No condition, order, status value or message was changed.
- Added `src/explanationAdapter.ts`, a clearly labeled MOCK LLM adapter (no API keys, no network).
- Added "Explain availability" button and labeled explanation box in `src/App.tsx`.
- Added dev dropdown to pick mock mode: normal (~500 ms) / timeout / error.

## Verification
- Tests: 22 passed, 0 failed
- Typecheck: no errors
- Lint: no errors

## Remaining limitations
- Explanation text is built from canned templates, not a real model. It is labeled as a mock in the UI.
- Timeout is enforced in the UI layer (3 s) via `withTimeout`; the adapter's `timeout` mode intentionally never resolves.
- When the adapter fails, times out, or returns an unusable explanation, the box falls back to the checker's own message with the note "Explanation unavailable — showing standard result."
- Reason codes for `unavailable` and `invalid` are mapped to the closest single code (`OVERLAP`, `INVALID_TIME`) because the adapter input accepts only one code per call.

## Practice #12 — Task #03: Code-based solution (contract.md)

## Change summary
- Split the rule engine into two layers: `src/lib/validation.ts` (rules 1–4: input format, duration, past start, day range) and `src/lib/checkAvailability.ts` (rules 5–7: blocked, overlap, available). `App.tsx` only displays.
- Input changed from start + end to start + duration (`end = start + duration`).
- Past start and duration outside 1–120 now return `invalid` (validation error) instead of `unavailable`.
- Validation runs before the blocked-room check.
- Result now has `available` (boolean), `status`, `reasonCode`, `message`. `DURATION_TOO_LONG` renamed to `INVALID_DURATION`.
- `explanationAdapter.ts` updated for the new reason code; result heading "Check failed" renamed to "Validation error".
- Tests rewritten for the new contract: T1–T8 added; earlier regression cases (touching endpoints, no mutation, 120 boundary, 1440 day end, 1e3 input) kept and adapted to duration input.

## Verification
- Tests: 26 passed, 0 failed
- Typecheck: no errors; Lint: no errors; Build: successful
- Browser run of T1–T8 at 375 px and 1280 px: 8/8 as expected, no horizontal scrolling

## Remaining limitations
- `@supabase/supabase-js` is still listed in package.json but unused (not removed: needs owner approval, see Task #07).
