
import { describe, it, expect } from 'vitest';
import { checkAvailability, parseInput } from './checkAvailability';

describe('checkAvailability', () => {
  it('returns unavailable when the room is blocked', () => {
    const result = checkAvailability({
      roomBlocked: true,
      now: 540,
      start: 700,
      end: 760,
      bookings: [],
    });

    expect(result.status).toBe('unavailable');
  });

  it('returns available for a free time slot', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 700,
      end: 760,
      bookings: [],
    });

    expect(result.status).toBe('available');
  });
  it('BUG-A: allows touching booking endpoints', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 500,
      start: 660,
      end: 720,
      bookings: [{ start: 600, end: 660 }],
    });
  
    expect(result.status).toBe('available');
  });
    it('BUG-B: does not mutate the original bookings array', () => {
    const bookings = [
      { start: 800, end: 860 },
      { start: 600, end: 660 },
    ];
  
    const original = structuredClone(bookings);
  
    checkAvailability({
      roomBlocked: false,
      now: 500,
      start: 700,
      end: 760,
      bookings,
    });
  
    expect(bookings).toEqual(original);
  });
  it('returns unavailable when the time overlaps an existing booking', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 630,
      end: 690,
      bookings: [{ start: 600, end: 660 }],
    });

    expect(result.status).toBe('unavailable');
  });

  it('AC1: rejects a start time in the past', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 600,
      start: 540,
      end: 600,
      bookings: [],
    });

    expect(result.status).toBe('unavailable');
    expect(result.message).toContain('now is 600');
  });

  it('AC1: rejects a reversed interval where start is after end', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 700,
      end: 660,
      bookings: [],
    });

    expect(result.status).toBe('invalid');
    expect(result.message).toBe(
      'Start must be before end. Please choose an end time later than the start time.'
    );
  });

  it('AC1: rejects a zero-length interval where start equals end', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 700,
      end: 700,
      bookings: [],
    });

    expect(result.status).toBe('invalid');
  });

  it('AC2: rejects a 121-minute duration', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 600,
      end: 721,
      bookings: [],
    });

    expect(result.status).toBe('unavailable');
    expect(result.message).toContain('Booking duration is 121 minutes');
  });

  it('AC2: allows a duration of exactly 120 minutes', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 600,
      end: 720,
      bookings: [],
    });

    expect(result.status).toBe('available');
  });

  it('AC3: keeps a blocked room unavailable for a free slot', () => {
    const result = checkAvailability({
      roomBlocked: true,
      now: 540,
      start: 700,
      end: 760,
      bookings: [],
    });

    expect(result.status).toBe('unavailable');
    expect(result.message).toContain('blocked');
  });

  it('AC4: rejects a slot that overlaps the 600-660 booking', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 620,
      end: 680,
      bookings: [{ start: 600, end: 660 }],
    });

    expect(result.status).toBe('unavailable');
    expect(result.message).toContain('overlaps an existing booking from 600 to 660');
  });

  it('AC4: allows slots that touch the 600-660 booking at either endpoint', () => {
    const before = checkAvailability({
      roomBlocked: false,
      now: 500,
      start: 540,
      end: 600,
      bookings: [{ start: 600, end: 660 }],
    });
    const after = checkAvailability({
      roomBlocked: false,
      now: 500,
      start: 660,
      end: 720,
      bookings: [{ start: 600, end: 660 }],
    });

    expect(before.status).toBe('available');
    expect(after.status).toBe('available');
  });

  it('AC5: leaves the 600-660 fixture unchanged after available and unavailable checks', () => {
    const bookings = [{ start: 600, end: 660 }];

    checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 700,
      end: 760,
      bookings,
    });
    checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 620,
      end: 680,
      bookings,
    });

    expect(bookings).toEqual([{ start: 600, end: 660 }]);
  });

  it('Rule (no AC): rejects an end time after the 1440-minute day end', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 1380,
      end: 1441,
      bookings: [],
    });

    expect(result.status).toBe('invalid');
    expect(result.message).toBe('End time must not exceed 1440 minutes (end of day).');
  });

  it('Rule (no AC): allows an end time at exactly the 1440-minute day end', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: 1380,
      end: 1440,
      bookings: [],
    });

    expect(result.status).toBe('available');
  });

  it('Input (no AC): a null start, end or now returns invalid', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: 540,
      start: null,
      end: 760,
      bookings: [],
    });

    expect(result.status).toBe('invalid');
    expect(result.message).toBe('Start time is empty or not a whole number.');
  });

  it('Input (no AC): a negative current time returns invalid', () => {
    const result = checkAvailability({
      roomBlocked: false,
      now: -500,
      start: 700,
      end: 760,
      bookings: [],
    });

    expect(result.status).toBe('invalid');
  });
});

describe('parseInput', () => {
  it('Input (no AC): turns blank and non-numeric text into null', () => {
    expect(parseInput({ start: '', end: null, now: 'abc' })).toEqual({
      start: null,
      end: null,
      now: null,
    });
  });

  it('Input (no AC): accepts whole-number text with surrounding spaces and numbers', () => {
    expect(parseInput({ start: ' 700 ', end: 760, now: '540' })).toEqual({
      start: 700,
      end: 760,
      now: 540,
    });
  });

  it('Input (no AC): rejects 1e3 and 700.0 as not whole-number text', () => {
    expect(parseInput({ start: '1e3', end: '700.0', now: '540' })).toEqual({
      start: null,
      end: null,
      now: 540,
    });
  });

  it('Input (no AC): a 1e3 start produces an invalid check with a clear message', () => {
    const result = checkAvailability({
      roomBlocked: false,
      bookings: [],
      ...parseInput({ start: '1e3', end: '1100', now: '540' }),
    });

    expect(result.status).toBe('invalid');
    expect(result.message).toBe('Start time is empty or not a whole number.');
  });
});
