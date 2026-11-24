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
