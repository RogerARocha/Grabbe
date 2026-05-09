/** Formats a raw ISO/SQLite datetime string as a locale-aware short date (e.g. "May 9, 2026"). */
function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Returns the ordinal label for a number: 1 → "1st", 2 → "2nd", 3 → "3rd", 4+ → "Nth". */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface Session {
  session_number: number;
  start_date: string | null;
  finish_date: string | null;
  is_active: boolean;
}

/** A SESSION_COMPLETED row from TrackingHistory. `new_value` holds the session ordinal (as string). */
interface HistoryEvent {
  event_type: string;
  /** JSON-encoded `{ score: number | null, reviewText: string | null }` */
  previous_value: string | null;
  /** Session ordinal as string (e.g. "1", "2") */
  new_value: string | null;
  event_date: string;
}

interface ArchivedEvaluation {
  score: number | null;
  reviewText: string | null;
}

interface ConsumptionTimelineProps {
  sessions: Session[];
  /** SESSION_COMPLETED events from TrackingHistory — one per completed session. */
  historyEvents: HistoryEvent[];
  /** The live review text from Ranking for the currently active session. */
  activeReviewText?: string | null;
  /** The live score from Ranking for the currently active session. */
  activeScore?: number | null;
  mediaType?: string;
}

/**
 * Renders the full consumption timeline for a tracked media item.
 *
 * Data routing:
 * - **Past sessions** (is_active = false): their score/review is reconstructed from the
 *   `SESSION_COMPLETED` events in `historyEvents`. The `new_value` column holds the session
 *   ordinal (as a string), used as the join key.
 * - **Active session** (is_active = true): uses `activeReviewText` and `activeScore`, which
 *   come directly from the live `Ranking` table and are empty after a rewatch is started.
 */
export const ConsumptionTimeline = ({
  sessions,
  historyEvents,
  activeReviewText,
  activeScore,
  mediaType,
}: ConsumptionTimelineProps) => {
  if (!sessions || sessions.length === 0) return null;

  const sessionNoun = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'GAME': return 'Playthrough';
      case 'BOOK':
      case 'MANGA':
      case 'COMIC': return 'Read';
      default: return 'Watch';
    }
  };
  const noun = sessionNoun(mediaType);

  /** Build a lookup map from session ordinal → archived evaluation. */
  const archivedByOrdinal = new Map<number, ArchivedEvaluation>();
  for (const event of historyEvents ?? []) {
    const ordinalKey = event.new_value ? parseInt(event.new_value, 10) : NaN;
    if (!isNaN(ordinalKey) && event.previous_value) {
      try {
        const parsed = JSON.parse(event.previous_value) as ArchivedEvaluation;
        archivedByOrdinal.set(ordinalKey, parsed);
      } catch {
        // Malformed JSON in history — skip gracefully.
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">history</span>
        Consumption Timeline
      </p>

      <div className="relative flex flex-col gap-0">
        {/* Vertical spine */}
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-outline-variant/20" />

        {sessions.map((s) => {
          const archived = !s.is_active ? archivedByOrdinal.get(s.session_number) : null;
          const displayScore    = s.is_active ? activeScore    : archived?.score    ?? null;
          const displayReview   = s.is_active ? activeReviewText : archived?.reviewText ?? null;

          return (
            <div key={s.session_number} className="flex items-start gap-4 py-3">
              {/* Dot */}
              <div
                className={`relative z-10 mt-0.5 w-3.5 h-3.5 rounded-full shrink-0 border-2 transition-colors ${
                  s.is_active
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/40'
                }`}
              />

              <div className="flex flex-col gap-0.5 min-w-0">
                {/* Row header */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-high">
                    {ordinal(s.session_number)} {noun}
                  </span>
                  {s.is_active && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                  {displayScore && (
                    <span className="text-[10px] font-bold tracking-wider prismatic-text">
                      {displayScore}/10
                    </span>
                  )}
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium">
                  <span>{formatDate(s.start_date)}</span>
                  {s.finish_date && (
                    <>
                      <span className="text-outline-variant/60">→</span>
                      <span>{formatDate(s.finish_date)}</span>
                    </>
                  )}
                  {!s.finish_date && s.is_active && (
                    <>
                      <span className="text-outline-variant/60">→</span>
                      <span className="text-primary/70 italic">in progress</span>
                    </>
                  )}
                </div>

                {/* Review text */}
                {displayReview && (
                  <p className="mt-1.5 text-sm text-text-high italic leading-relaxed border-l-2 border-outline-variant/30 pl-3">
                    "{displayReview}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
