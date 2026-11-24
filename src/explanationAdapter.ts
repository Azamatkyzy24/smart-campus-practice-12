import type { ReasonCode } from '@/lib/checkAvailability';

export type MockMode = 'normal' | 'timeout' | 'error';

export type ExplanationInput = {
  roomLabel: string;
  start: number;
  end: number;
  isAvailable: boolean;
  reasonCode: ReasonCode;
};

export type ExplanationOutput = {
  explanation: string;
};

const KNOWN_REASON_CODES: ReasonCode[] = [
  'ROOM_BLOCKED',
  'INVALID_INPUT',
  'INVALID_TIME',
  'PAST_TIME',
  'INVALID_DURATION',
  'OVERLAP',
  'AVAILABLE',
];

const MAX_SENTENCES = 2;
const MAX_EXPLANATION_LENGTH = 300;

export class ExplanationInputError extends Error {}
export class ExplanationTimeoutError extends Error {
  constructor() {
    super('Explanation timed out.');
  }
}
export class ExplanationGenerationError extends Error {
  constructor() {
    super('Explanation generation failed.');
  }
}

export function validateExplanationInput(input: ExplanationInput): void {
  if (!KNOWN_REASON_CODES.includes(input.reasonCode)) {
    throw new ExplanationInputError(`Unknown reasonCode: ${input.reasonCode}`);
  }
  if (!Number.isInteger(input.start) || input.start < 0 || input.start > 1440) {
    throw new ExplanationInputError('start must be a whole number between 0 and 1440.');
  }
  if (!Number.isInteger(input.end) || input.end < 0 || input.end > 1440) {
    throw new ExplanationInputError('end must be a whole number between 0 and 1440.');
  }
  if (typeof input.roomLabel !== 'string' || input.roomLabel.length === 0 || input.roomLabel.length > 50) {
    throw new ExplanationInputError('roomLabel must be 1-50 characters.');
  }
}

function countSentences(text: string): number {
  return text.split(/[.!?]+\s|[.!?]+$/).filter((s) => s.trim().length > 0).length;
}

export function validateExplanationOutput(output: ExplanationOutput, input: ExplanationInput): void {
  const text = output.explanation;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new ExplanationGenerationError();
  }
  if (text.length > MAX_EXPLANATION_LENGTH) {
    throw new ExplanationGenerationError();
  }
  if (countSentences(text) > MAX_SENTENCES) {
    throw new ExplanationGenerationError();
  }
  const saysAvailable = /\bavailable\b/i.test(text);
  if (saysAvailable !== input.isAvailable) {
    throw new ExplanationGenerationError();
  }
}

function buildExplanation(input: ExplanationInput): string {
  const room = input.roomLabel;
  const slot = `${input.start}–${input.end}`;

  switch (input.reasonCode) {
    case 'ROOM_BLOCKED':
      return `${room} is currently blocked, so no time slot can be requested right now.`;
    case 'INVALID_INPUT':
      return 'The start time, duration or current time was left blank or is not a whole number, so the request cannot be checked.';
    case 'INVALID_TIME':
      return 'The requested slot does not fit inside the day (0–1440 minutes), so it cannot be checked.';
    case 'PAST_TIME':
      return `The requested start (${input.start} min) is not after the current time, so ${room} cannot be booked for ${slot}.`;
    case 'INVALID_DURATION':
      return `The requested duration must be between 1 and 120 minutes for ${room}.`;
    case 'OVERLAP':
      return `The requested slot ${slot} overlaps a time already reserved in ${room}.`;
    case 'AVAILABLE':
      return `${room} is available for the requested slot ${slot}, so you can go ahead and plan your session.`;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref?.();
  });
}

/**
 * MOCK LLM adapter — this does NOT call a real model. It simulates one locally
 * with a fixed delay and no API keys. Returns a canned 1–2 sentence explanation
 * built only from the validated input fields.
 */
export async function requestExplanation(
  input: ExplanationInput,
  mode: MockMode = 'normal'
): Promise<ExplanationOutput> {
  validateExplanationInput(input);

  if (mode === 'timeout') {
    // Never resolves within the caller's 3s budget.
    await delay(10_000);
    return { explanation: buildExplanation(input) };
  }
  if (mode === 'error') {
    throw new ExplanationGenerationError();
  }

  await delay(500);
  const output: ExplanationOutput = { explanation: buildExplanation(input) };
  validateExplanationOutput(output, input);
  return output;
}
