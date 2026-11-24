import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, DoorClosed, DoorOpen, CheckCircle2, XCircle, AlertTriangle, Lock, Unlock, Sparkles } from 'lucide-react';
import { checkAvailability, parseInput, type Booking, type CheckResult } from '@/lib/checkAvailability';

import {
  requestExplanation,
  ExplanationInputError,
  ExplanationTimeoutError,
  ExplanationGenerationError,
  type MockMode,
} from '@/explanationAdapter';

const EXPLANATION_TIMEOUT_MS = 3000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ExplanationTimeoutError()), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const mockModeLabels: Record<MockMode, string> = {
  normal: 'Normal (~500 ms)',
  timeout: 'Timeout (no reply)',
  error: 'Error (immediate failure)',
};

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function App() {
  const [roomBlocked, setRoomBlocked] = useState(false);
  const [now, setNow] = useState('540');
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState('');
  const [bookings] = useState<Booking[]>([{ start: 600, end: 660 }]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [mockMode, setMockMode] = useState<MockMode>('normal');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationNote, setExplanationNote] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const explanationRequestIdRef = useRef(0);

  useEffect(() => {
    setResult(null);
  }, [start, duration, now, roomBlocked]);

  useEffect(() => {
    setExplanation(null);
    setExplanationNote(null);
  }, [result]);

  const nowValid = useMemo(() => {
    const n = Number(now);
    return now.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 1440;
  }, [now]);

  const handleCheck = () => {
    setResult(
      checkAvailability({
        roomBlocked,
        ...parseInput({ start, duration, now }),
        bookings,
      })
    );
  };

  const handleReset = () => {
    setStart('');
    setDuration('');
    setResult(null);
  };

  const handleExplain = async () => {
    if (!result) return;
    const requestId = ++explanationRequestIdRef.current;
    setExplanation(null);
    setExplanationNote(null);
    setExplanationLoading(true);
    try {
      const output = await withTimeout(
        requestExplanation(
          {
            roomLabel: 'Room A-101',
            start: Number(start),
            end: Number(start) + Number(duration),
            isAvailable: result.available,
            reasonCode: result.reasonCode,
          },
          mockMode
        ),
        EXPLANATION_TIMEOUT_MS
      );
      if (explanationRequestIdRef.current !== requestId) return;
      setExplanation(output.explanation);
    } catch (err) {
      if (explanationRequestIdRef.current !== requestId) return;
      if (
        err instanceof ExplanationTimeoutError ||
        err instanceof ExplanationGenerationError ||
        err instanceof ExplanationInputError
      ) {
        setExplanation(result.message);
        setExplanationNote('Explanation unavailable — showing standard result.');
      } else {
        throw err;
      }
    } finally {
      if (explanationRequestIdRef.current === requestId) {
        setExplanationLoading(false);
      }
    }
  };

  const resultStyles =
    result?.status === 'available'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : result?.status === 'unavailable'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-amber-50 border-amber-200 text-amber-800';

  const ResultIcon =
    result?.status === 'available' ? CheckCircle2 : result?.status === 'unavailable' ? XCircle : AlertTriangle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <DoorClosed className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Room Availability Checker</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Check whether a time slot is free before you book. This tool does not create bookings.
          </p>
        </header>

        {/* Room card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <DoorOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Room A-101</h2>
                <p className="text-xs text-slate-500">Lecture room · Capacity 40</p>
              </div>
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50">
              {roomBlocked ? (
                <Lock className="h-4 w-4 text-rose-500" />
              ) : (
                <Unlock className="h-4 w-4 text-emerald-500" />
              )}
              <span className="text-slate-700">Room blocked</span>
              <input
                type="checkbox"
                checked={roomBlocked}
                onChange={(e) => setRoomBlocked(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </section>

        {/* Now input */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="now" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Clock className="h-4 w-4 text-blue-600" />
            Current time (now)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              id="now"
              type="number"
              value={now}
              onChange={(e) => setNow(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-40"
            />
            <span className="text-sm text-slate-500">
              {nowValid ? `= ${formatTime(Number(now))}` : 'Enter minutes after midnight (0–1440)'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Whole minutes after midnight. Default 540 (9:00 AM).</p>
        </section>

        {/* Check form */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 text-base font-semibold">Check a time slot</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start" className="mb-1.5 block text-sm font-medium text-slate-700">
                Start (minutes)
              </label>
              <input
                id="start"
                type="number"
                inputMode="numeric"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="e.g. 700"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="duration" className="mb-1.5 block text-sm font-medium text-slate-700">
                Duration (minutes, 1–120)
              </label>
              <input
                id="duration"
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 60"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleCheck}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-[0.98]"
            >
              Check availability
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Result */}
        {result && (
          <section className={`mb-6 rounded-2xl border p-5 shadow-sm transition sm:p-6 ${resultStyles}`}>
            <div className="flex items-start gap-3">
              <ResultIcon className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="text-base font-bold">
                  {result.status === 'available'
                    ? 'Available'
                    : result.status === 'unavailable'
                    ? 'Unavailable'
                    : 'Validation error'}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{result.message}</p>
              </div>
            </div>
            <button
              onClick={handleExplain}
              disabled={explanationLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-current/20 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              {explanationLoading ? 'Explaining…' : 'Explain availability'}
            </button>
          </section>
        )}

        {/* Explanation (mock AI) */}
        {result && (explanation !== null || explanationNote !== null) && (
          <section
            aria-live="polite"
            className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  AI-generated explanation (mock) — the status above is the official result.
                </p>
                {explanationNote ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{explanation}</p>
                    <p className="mt-2 text-xs font-medium text-amber-700">{explanationNote}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{explanation}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Existing bookings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Existing bookings</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {bookings.map((b, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-700">
                  {formatTime(b.start)} – {formatTime(b.end)}
                </span>
                <span className="text-slate-400">
                  {b.start}–{b.end} min
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Read-only. The checker never changes these bookings.
          </p>
        </section>

        {/* Dev-only: mock mode picker */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <label htmlFor="mock-mode" className="font-medium">
            Dev: mock mode
          </label>
          <select
            id="mock-mode"
            value={mockMode}
            onChange={(e) => setMockMode(e.target.value as MockMode)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
          >
            {(Object.keys(mockModeLabels) as MockMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {mockModeLabels[mode]}
              </option>
            ))}
          </select>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Smart Campus Room Availability Checker · No booking is created by this tool.
        </footer>
      </div>
    </div>
  );
}
