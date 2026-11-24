// Availability layer: decides Available / Unavailable for a request that has
// already passed validation (rules 5–7). Pure functions, never changes bookings.
import { validateRequest, type ValidationCode } from './validation';

export { parseInput } from './validation';

export type Booking = {
  start: number;
  end: number;
};

export type CheckInput = {
  roomBlocked: boolean;
  now: number | null;
  start: number | null;
  duration: number | null;
  bookings: readonly Booking[];
};

export type ReasonCode = ValidationCode | 'ROOM_BLOCKED' | 'OVERLAP' | 'AVAILABLE';

export type CheckResult = {
  available: boolean;
  status: 'available' | 'unavailable' | 'invalid';
  reasonCode: ReasonCode;
  message: string;
};

/** Touching endpoints (one ends exactly when the other starts) is not an overlap. */
export const overlaps = (a: Booking, b: Booking): boolean => Math.max(a.start, b.start) < Math.min(a.end, b.end);

export function checkAvailability(input: CheckInput): CheckResult {
  // Rules 1–4: validation always comes first (AC1, AC2, AC6)
  const validation = validateRequest(input);
  if (!validation.ok) {
    return { available: false, status: 'invalid', reasonCode: validation.reasonCode, message: validation.message };
  }
  const { start, end, duration } = validation.request;

  // Rule 5: blocked room (AC4)
  if (input.roomBlocked) {
    return {
      available: false,
      status: 'unavailable',
      reasonCode: 'ROOM_BLOCKED',
      message: 'Room A-101 is blocked and cannot be booked.',
    };
  }

  // Rule 6: overlap with an existing booking (AC3)
  const conflict = input.bookings.find((b) => overlaps({ start, end }, b));
  if (conflict) {
    return {
      available: false,
      status: 'unavailable',
      reasonCode: 'OVERLAP',
      message: `Unavailable: ${start}–${end} overlaps the existing booking ${conflict.start}–${conflict.end}.`,
    };
  }

  // Rule 7: available
  return {
    available: true,
    status: 'available',
    reasonCode: 'AVAILABLE',
    message: `Available: Room A-101 is free from ${start} to ${end} (${duration} min).`,
  };
}
