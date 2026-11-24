export type Booking = {
  start: number;
  end: number;
};

export type CheckInput = {
  roomBlocked: boolean;
  now: number | null;
  start: number | null;
  end: number | null;
  bookings: Booking[];
};

export type ReasonCode =
  | 'ROOM_BLOCKED'
  | 'INVALID_INPUT'
  | 'INVALID_TIME'
  | 'PAST_TIME'
  | 'DURATION_TOO_LONG'
  | 'OVERLAP'
  | 'AVAILABLE';

export type CheckResult =
  | { status: 'available'; message: string; reasonCode: ReasonCode }
  | { status: 'unavailable'; message: string; reasonCode: ReasonCode }
  | { status: 'invalid'; message: string; reasonCode: ReasonCode };

const asInt = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '+') return null;
    if (!/^-?\d+$/.test(trimmed)) return null;
    const n = Number(trimmed);
    return Number.isInteger(n) ? n : null;
  }
  return null;
};

const overlaps = (a: Booking, b: Booking): boolean =>
  Math.max(a.start, b.start) < Math.min(a.end, b.end);

export function parseInput(raw: { start: unknown; end: unknown; now: unknown }) {
  return {
    start: asInt(raw.start),
    end: asInt(raw.end),
    now: asInt(raw.now),
  };
}

/**
 * Pure availability check. Returns a status of 'available', 'unavailable',
 * or 'invalid' with a human-readable message. Never mutates bookings.
 */
export function checkAvailability(input: CheckInput): CheckResult {
  if (input.roomBlocked) {
    return {
      status: 'unavailable',
      message: 'Room A-101 is currently blocked and cannot be booked at any time.',
      reasonCode: 'ROOM_BLOCKED',
    };
  }

  const startInt = typeof input.start === 'number' && Number.isInteger(input.start) ? input.start : null;
  const endInt = typeof input.end === 'number' && Number.isInteger(input.end) ? input.end : null;
  const nowInt = typeof input.now === 'number' && Number.isInteger(input.now) ? input.now : null;

  if (startInt === null) {
    return { status: 'invalid', message: 'Start time is empty or not a whole number.', reasonCode: 'INVALID_INPUT' };
  }
  if (endInt === null) {
    return { status: 'invalid', message: 'End time is empty or not a whole number.', reasonCode: 'INVALID_INPUT' };
  }
  if (nowInt === null) {
    return { status: 'invalid', message: 'Current time (now) is empty or not a whole number.', reasonCode: 'INVALID_INPUT' };
  }
  if (nowInt < 0 || nowInt > 1440) {
    return { status: 'invalid', message: 'Current time (now) must be between 0 and 1440 minutes.', reasonCode: 'INVALID_TIME' };
  }

  if (startInt >= endInt) {
    return {
      status: 'invalid',
      message: 'Start must be before end. Please choose an end time later than the start time.',
      reasonCode: 'INVALID_TIME',
    };
  }

  if (startInt < 0 || endInt < 0) {
    return { status: 'invalid', message: 'Times cannot be negative (allowed range is 0–1440 minutes).', reasonCode: 'INVALID_TIME' };
  }
  if (endInt > 1440) {
    return { status: 'invalid', message: 'End time must not exceed 1440 minutes (end of day).', reasonCode: 'INVALID_TIME' };
  }

  if (startInt <= nowInt) {
    return {
      status: 'unavailable',
      message: `Start must be strictly after the current time (now is ${nowInt}). Please pick a start later than ${nowInt}.`,
      reasonCode: 'PAST_TIME',
    };
  }

  const duration = endInt - startInt;
  if (duration > 120) {
    return {
      status: 'unavailable',
      message: `Booking duration is ${duration} minutes, which exceeds the 120-minute maximum. Please shorten the end time.`,
      reasonCode: 'DURATION_TOO_LONG',
    };
  }

  const requested = { start: startInt, end: endInt };
  const conflict = input.bookings.find((b) => overlaps(requested, b));
  if (conflict) {
    return {
      status: 'unavailable',
      message: `Unavailable: your requested time ${startInt}–${endInt} overlaps an existing booking from ${conflict.start} to ${conflict.end}.`,
      reasonCode: 'OVERLAP',
    };
  }

  return {
    status: 'available',
    message: `Available: Room A-101 is free from ${startInt} to ${endInt} (${duration} min).`,
    reasonCode: 'AVAILABLE',
  };
}
