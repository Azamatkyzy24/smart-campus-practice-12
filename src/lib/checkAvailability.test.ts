import { describe, it, expect } from 'vitest';
import { checkAvailability, parseInput, overlaps, type Booking } from './checkAvailability';
import { validateRequest } from './validation';

// Shared fixture from contract.md: now = 540, one booking 600–660
const NOW = 540;
const fixture = (): Booking[] => [{ start: 600, end: 660 }];

const check = (start: number | null, duration: number | null, roomBlocked = false, bookings = fixture()) =>
  checkAvailability({ roomBlocked, now: NOW, start, duration, bookings });

// ---------------------------------------------------------------
// Practice #12 common tests T1–T8 (same inputs as the low-code app)
// ---------------------------------------------------------------
describe('Practice #12 contract tests T1–T8', () => {
  it('T1: valid free interval (700, 60) -> Available', () => {
    const r = check(700, 60);
    expect(r.available).toBe(true);
    expect(r.reasonCode).toBe('AVAILABLE');
    expect(r.message).toBe('Available: Room A-101 is free from 700 to 760 (60 min).');
  });

  it('T2: overlap with existing booking (630, 60) -> Unavailable', () => {
    const r = check(630, 60);
    expect(r.available).toBe(false);
    expect(r.status).toBe('unavailable');
    expect(r.reasonCode).toBe('OVERLAP');
    expect(r.message).toBe('Unavailable: 630–690 overlaps the existing booking 600–660.');
  });

  it('T3: blocked room (700, 60, blocked) -> Unavailable', () => {
    const r = check(700, 60, true);
    expect(r.available).toBe(false);
    expect(r.status).toBe('unavailable');
    expect(r.reasonCode).toBe('ROOM_BLOCKED');
  });

  it('T4: duration = 0 -> validation error', () => {
    const r = check(700, 0);
    expect(r.status).toBe('invalid');
    expect(r.reasonCode).toBe('INVALID_DURATION');
    expect(r.message).toBe('Duration must be between 1 and 120 minutes.');
  });

  it('T5: duration = 121 -> validation error', () => {
    const r = check(700, 121);
    expect(r.status).toBe('invalid');
    expect(r.reasonCode).toBe('INVALID_DURATION');
  });

  it('T6: past start time (500, 30) -> validation error', () => {
    const r = check(500, 30);
    expect(r.status).toBe('invalid');
    expect(r.reasonCode).toBe('PAST_TIME');
    expect(r.message).toBe('Start time must be in the future (now is 540).');
  });

  it('T7: adjacent non-overlapping interval (660, 60) -> Available', () => {
    const r = check(660, 60);
    expect(r.available).toBe(true);
    expect(r.reasonCode).toBe('AVAILABLE');
  });

  it('T8: booking data unchanged after running T1–T7', () => {
    const bookings = fixture();
    const inputs: [number, number, boolean][] = [
      [700, 60, false],
      [630, 60, false],
      [700, 60, true],
      [700, 0, false],
      [700, 121, false],
      [500, 30, false],
      [660, 60, false],
    ];
    for (const [start, duration, blocked] of inputs) check(start, duration, blocked, bookings);
    expect(bookings).toEqual([{ start: 600, end: 660 }]);
  });
});

// ---------------------------------------------------------------
// Earlier regression tests, updated to the Practice #12 contract
// ---------------------------------------------------------------
describe('checkAvailability regressions', () => {
  it('AC2: allows exactly 120 minutes', () => {
    expect(check(700, 120).reasonCode).toBe('AVAILABLE');
  });

  it('AC1: start equal to now is treated as past', () => {
    expect(check(540, 30).reasonCode).toBe('PAST_TIME');
  });

  it('AC3: allows a slot that ends exactly when the booking starts (570–600)', () => {
    const r = checkAvailability({ roomBlocked: false, now: 500, start: 570, duration: 30, bookings: fixture() });
    expect(r.reasonCode).toBe('AVAILABLE');
  });

  it('AC3: rejects a request that fully contains the booking', () => {
    expect(check(590, 80).reasonCode).toBe('OVERLAP');
  });

  it('AC4 + AC6: blocked room with invalid input shows the validation error first', () => {
    const r = check(700, 0, true);
    expect(r.status).toBe('invalid');
    expect(r.reasonCode).toBe('INVALID_DURATION');
  });

  it('BUG-B: does not mutate or reorder the bookings array', () => {
    const bookings = [
      { start: 800, end: 860 },
      { start: 600, end: 660 },
    ];
    const original = structuredClone(bookings);
    check(700, 60, false, bookings);
    expect(bookings).toEqual(original);
  });

  it('Rule 4 (no AC): rejects an end time after 1440', () => {
    const r = check(1400, 60);
    expect(r.status).toBe('invalid');
    expect(r.reasonCode).toBe('INVALID_TIME');
  });

  it('Rule 4 (no AC): allows ending exactly at 1440', () => {
    expect(check(1380, 60).reasonCode).toBe('AVAILABLE');
  });

  it('AC6: empty start gives a clear INVALID_INPUT message', () => {
    const r = check(null, 60);
    expect(r.reasonCode).toBe('INVALID_INPUT');
    expect(r.message).toBe('Start time and duration must be whole numbers.');
  });

  it('AC6: invalid current time gives a clear message', () => {
    const r = checkAvailability({ roomBlocked: false, now: -500, start: 700, duration: 60, bookings: [] });
    expect(r.reasonCode).toBe('INVALID_INPUT');
    expect(r.message).toContain('Current time (now)');
  });

  it('AC6: negative duration is a duration error', () => {
    expect(check(700, -30).reasonCode).toBe('INVALID_DURATION');
  });
});

describe('overlaps', () => {
  it('touching endpoints do not overlap', () => {
    expect(overlaps({ start: 660, end: 720 }, { start: 600, end: 660 })).toBe(false);
    expect(overlaps({ start: 540, end: 600 }, { start: 600, end: 660 })).toBe(false);
  });
  it('partial overlap is detected', () => {
    expect(overlaps({ start: 630, end: 690 }, { start: 600, end: 660 })).toBe(true);
  });
});

describe('parseInput / validateRequest', () => {
  it('turns blank and non-numeric text into null', () => {
    expect(parseInput({ start: '', duration: null, now: 'abc' })).toEqual({ start: null, duration: null, now: null });
  });

  it('accepts whole-number text with spaces', () => {
    expect(parseInput({ start: ' 700 ', duration: '60', now: 540 })).toEqual({ start: 700, duration: 60, now: 540 });
  });

  it('rejects 1e3 and 60.5 as not whole numbers', () => {
    expect(parseInput({ start: '1e3', duration: '60.5', now: '540' })).toEqual({ start: null, duration: null, now: 540 });
  });

  it('a 1e3 start produces INVALID_INPUT', () => {
    const r = checkAvailability({ roomBlocked: false, bookings: [], ...parseInput({ start: '1e3', duration: '60', now: '540' }) });
    expect(r.reasonCode).toBe('INVALID_INPUT');
  });

  it('valid request returns the computed end', () => {
    expect(validateRequest({ start: 700, duration: 60, now: 540 })).toEqual({
      ok: true,
      request: { start: 700, duration: 60, end: 760, now: 540 },
    });
  });
});
