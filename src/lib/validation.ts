// Validation layer: turns raw form values into whole numbers and checks
// them against the contract (rules 1–4). No booking logic and no UI here.

export type ValidationCode = 'INVALID_INPUT' | 'INVALID_DURATION' | 'PAST_TIME' | 'INVALID_TIME';

export type ValidRequest = {
  start: number;
  duration: number;
  end: number;
  now: number;
};

export type ValidationResult =
  | { ok: true; request: ValidRequest }
  | { ok: false; reasonCode: ValidationCode; message: string };

export const MAX_DURATION = 120;
export const DAY_END = 1440;

/** Accepts whole numbers (or whole-number text like " 700 "). Anything else becomes null. */
export function toWholeNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isInteger(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    return Number(trimmed);
  }
  return null;
}

export function parseInput(raw: { start: unknown; duration: unknown; now: unknown }) {
  return {
    start: toWholeNumber(raw.start),
    duration: toWholeNumber(raw.duration),
    now: toWholeNumber(raw.now),
  };
}

export function validateRequest(input: {
  start: number | null;
  duration: number | null;
  now: number | null;
}): ValidationResult {
  const start = toWholeNumber(input.start);
  const duration = toWholeNumber(input.duration);
  const now = toWholeNumber(input.now);

  // Rule 1: inputs must be whole numbers
  if (now === null || now < 0 || now > DAY_END) {
    return {
      ok: false,
      reasonCode: 'INVALID_INPUT',
      message: `Current time (now) must be a whole number between 0 and ${DAY_END}.`,
    };
  }
  if (start === null || duration === null) {
    return { ok: false, reasonCode: 'INVALID_INPUT', message: 'Start time and duration must be whole numbers.' };
  }

  // Rule 2: duration 1–120 (AC2)
  if (duration <= 0 || duration > MAX_DURATION) {
    return {
      ok: false,
      reasonCode: 'INVALID_DURATION',
      message: `Duration must be between 1 and ${MAX_DURATION} minutes.`,
    };
  }

  // Rule 3: start must be in the future (AC1)
  if (start <= now) {
    return { ok: false, reasonCode: 'PAST_TIME', message: `Start time must be in the future (now is ${now}).` };
  }

  // Rule 4: must fit inside the day (no AC, kept from baseline)
  const end = start + duration;
  if (start < 0 || end > DAY_END) {
    return {
      ok: false,
      reasonCode: 'INVALID_TIME',
      message: `The booking must start and end within the same day (0–${DAY_END} minutes).`,
    };
  }

  return { ok: true, request: { start, duration, end, now } };
}
