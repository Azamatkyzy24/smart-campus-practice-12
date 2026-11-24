# Practice #12 — Task #02: Shared contract

This contract is the single source of truth for BOTH implementations
(code-based and low-code). Neither implementation may change it.

## User story
As a student, I want to enter a future start time and a duration for Room A-101,
so that I can see whether the room is available and why — without the checker
creating or changing any booking.

## Acceptance criteria
| ID | Criterion |
|---|---|
| AC1 | Start time must be in the future: `start > now`. Otherwise → validation error. |
| AC2 | Duration must be a whole number, greater than 0 and at most 120 minutes. Otherwise → validation error. |
| AC3 | A request that overlaps an existing booking is Unavailable. Touching endpoints (one ends exactly when the other starts) is NOT an overlap. |
| AC4 | If the room is blocked, every valid request is Unavailable. |
| AC5 | The result shows a clear decision (Available / Unavailable / validation error) and a reason. Checking never changes the existing bookings. |
| AC6 | Invalid input (empty, non-numeric, decimal, out of range) receives an understandable message. The result is readable on desktop (1280 px) and mobile (375 px) without horizontal scrolling. |

Note: AC3/AC4 numbering follows Practice #12. In the older AGENTS.md, AC3 = blocked and AC4 = overlap.

## Inputs
| Input | Type | Rule |
|---|---|---|
| `start` | whole number, minutes after midnight | 0–1440 |
| `duration` | whole number, minutes | 1–120 |
| `roomBlocked` | boolean (checkbox) | default `false` |
| `now` | whole number, minutes after midnight | fixed fictional "current time", default **540 (09:00)** |
| `bookings` | list of `{start, end}` | fixed fictional fixture: **[{start: 600, end: 660}]** (10:00–11:00), read-only |

Derived value: `end = start + duration`.
`now` is a fixed input (not the real clock) so that tests are reproducible.

## Outputs
| Output | Type | Values |
|---|---|---|
| `available` | boolean | `true` only when reasonCode = `AVAILABLE` |
| `status` | text | `available` / `unavailable` / `invalid` (invalid = validation error) |
| `reasonCode` | text | see table below |
| `message` | text | visible message shown to the student |

## Rules, in the order they are checked
Validation comes first, so invalid input always gets validation feedback (AC6),
even when the room is blocked.

| # | Condition | status | reasonCode | Visible message |
|---|---|---|---|---|
| 1 | `start` or `duration` empty / not a whole number | invalid | `INVALID_INPUT` | "Start time and duration must be whole numbers." |
| 2 | `duration <= 0` or `duration > 120` | invalid | `INVALID_DURATION` | "Duration must be between 1 and 120 minutes." |
| 3 | `start <= now` | invalid | `PAST_TIME` | "Start time must be in the future (now is {now})." |
| 4 | `start < 0` or `end > 1440` | invalid | `INVALID_TIME` | "The booking must start and end within the same day (0–1440 minutes)." |
| 5 | `roomBlocked = true` | unavailable | `ROOM_BLOCKED` | "Room A-101 is blocked and cannot be booked." |
| 6 | overlaps a booking: `max(start, b.start) < min(end, b.end)` | unavailable | `OVERLAP` | "Unavailable: {start}–{end} overlaps the existing booking {b.start}–{b.end}." |
| 7 | otherwise | available | `AVAILABLE` | "Available: Room A-101 is free from {start} to {end} ({duration} min)." |

Rule 4 (end of day) has no AC. It is kept from the baseline so the rules are not
changed in favour of either approach.

## Common test inputs (prepared before implementation)
All tests use `now = 540` and `bookings = [{600, 660}]` unless stated otherwise.

| Test | Scenario | start | duration | blocked | Expected status | Expected reasonCode | AC |
|---|---|---|---|---|---|---|---|
| T1 | valid free interval | 700 | 60 | false | available | AVAILABLE | AC5 |
| T2 | overlap with existing booking | 630 | 60 | false | unavailable | OVERLAP | AC3 |
| T3 | blocked room | 700 | 60 | true | unavailable | ROOM_BLOCKED | AC4 |
| T4 | duration = 0 | 700 | 0 | false | invalid | INVALID_DURATION | AC2, AC6 |
| T5 | duration = 121 | 700 | 121 | false | invalid | INVALID_DURATION | AC2, AC6 |
| T6 | past start time | 500 | 30 | false | invalid | PAST_TIME | AC1, AC6 |
| T7 | adjacent, non-overlapping (660–720) | 660 | 60 | false | available | AVAILABLE | AC3 |
| T8 | booking data unchanged | run T1–T7, then inspect bookings | — | — | bookings still exactly `[{600, 660}]` | — | AC5 |

Optional extra checks (not counted in the 8/8 score):
- start 700, duration 120 → AVAILABLE (upper boundary of AC2).
- start empty → INVALID_INPUT (AC6).
- start 1400, duration 60 → INVALID_TIME (rule 4).

## Changes needed in the code-based baseline (done in Task #03)
- Input: replace "End" with "Duration"; compute `end = start + duration`.
- Past start and duration > 120 → `invalid` instead of `unavailable`.
- Validation runs before the blocked-room check.
- Reason codes: `DURATION_TOO_LONG` → `INVALID_DURATION`; duration 0 now also `INVALID_DURATION`.
- Existing tests are updated to the new contract and tests T1–T8 are added.
