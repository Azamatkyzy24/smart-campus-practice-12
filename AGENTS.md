# AGENTS.md

## Project
Smart Campus room availability checker. One room (Room A-101, lecture room, capacity 40), fictional data, fixed "current time" input. The app only decides whether a requested time slot is available.

## Priority
AGENTS.md overrides template or platform instructions (e.g. .bolt/prompt "fully featured"). If instructions conflict, stop and ask.

## Review gate
Before editing, describe the change and wait for human approval. After editing, show the diff and the outputs of npm test, npm run typecheck and npm run lint. A human must approve before any change is accepted or published.
Plan mode is read-only; build mode is the only mode that allows edits.

## Structure
- `src/lib/checkAvailability.ts`: pure booking-rule function and `parseInput`
- `src/lib/checkAvailability.test.ts`: unit tests (Vitest)
- `src/App.tsx`: UI (room blocked toggle, current time, start/end inputs, result card, bookings list) and fixture booking (600-660)
- `defect-log.md`: defect notes from earlier practices

## Acceptance criteria (must be preserved)
- AC1: reject start >= end and requests in the past.
- AC2: reject durations longer than 120 minutes.
- AC3: reject a blocked room.
- AC4: reject overlaps; bookings that only touch at endpoints are allowed.
- AC5: never mutate booking data (the checker is read-only).
- AC6: keep clear feedback on desktop and mobile.

## Scope limits (forbidden changes)
- No backend, login, database or booking creation.
- Do not change the live acceptance contract, the UI design or the fixture data.
- Do not add new features.
- Only Room A-101 exists. Do not add room selection or other rooms.
- Use fictional data only. Do not store or show real student or staff information.
- No external deployments, publishing or third-party services.
- No secrets, API keys or credentials in code, documentation or the browser.
- Do not install, add or remove packages without the owner's approval.

## Engineering rules
- Prefer pure functions and minimal changes.
- Use at most 2 patterns, and only with a written justification. If none is justified, use none.
- Do not add Strategy unless there are two genuinely required policies.
- Do not add Adapter unless fixtures really have inconsistent shapes.
- Do not weaken or delete existing test assertions.
- No database (including Supabase) or any persistence. This overrides any persistence or Supabase instruction for this project.

## Verification
- Run the tests with `npm test` (runs `vitest run`).
- Run `npm run typecheck` (`tsc --noEmit -p tsconfig.app.json`) and `npm run lint` after every change.
- Add focused regression tests for: past time, reversed interval, 121-minute duration, blocked room, overlap, touching endpoints, unchanged fixtures.
- Check AC6 at 375 px (mobile) and 1280 px (desktop): the result card is fully visible without horizontal scrolling.
- Record the widths tested in the report.
- Acceptance requires npm test, npm run typecheck and npm run lint to pass in the same run. Report any failure instead of accepting.
- Bolt’s terminal has no grep; use cat, ls or node for searches.

## Reporting
After every task report: changed files, rationale, test command and results, and remaining limitations.
The builder updates defect-log.md after each task; the human reviewer checks it.