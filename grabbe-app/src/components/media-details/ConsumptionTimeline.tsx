import { useState } from 'react';
import { formatPartialDate } from '../shared/PartialDateInput';
import { EditSessionModal } from '../modals/EditSessionModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import type { PastSessionUpdate } from '../../lib/db';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface Session {
  id?: string;
  session_number: number;
  start_date: string | null;
  finish_date: string | null;
  is_active: boolean;
}

interface HistoryEvent {
  id?: string;
  event_type: string;
  previous_value: string | null;
  new_value: string | null;
  event_date: string;
}

interface ArchivedEvaluation {
  score: number | null;
  reviewText: string | null;
  finalStatus?: string;
}

interface ConsumptionTimelineProps {
  sessions: Session[];
  historyEvents: HistoryEvent[];
  activeReviewText?: string | null;
  activeScore?: number | null;
  mediaType?: string;
  releaseYear?: number;
  onUpdateSession?: (sessionId: string, sessionNumber: number, payload: PastSessionUpdate) => Promise<void>;
  onDeleteSession?: (sessionId: string, sessionNumber: number) => Promise<void>;
}

/**
 * Returns the Tailwind colour classes and label for a past-session status badge.
 * Follows the GrabbeCS status colour map defined in DESIGN.md.
 */
function statusBadge(status?: string): { classes: string; label: string } {
  switch (status) {
    case 'COMPLETED':
      return { classes: 'bg-secondary/15 text-secondary', label: 'Completed' };
    case 'DROPPED':
      return { classes: 'bg-tertiary/15 text-tertiary', label: 'Dropped' };
    case 'ON HOLD':
      return { classes: 'bg-warning/15 text-warning', label: 'On Hold' };
    default:
      return { classes: 'bg-secondary/15 text-secondary', label: 'Completed' };
  }
}

/**
 * Renders the full consumption timeline for a tracked media item.
 *
 * Data routing:
 * - **Past sessions** (is_active = false): their score/review/status is reconstructed from the
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
  releaseYear,
  onUpdateSession,
  onDeleteSession,
}: ConsumptionTimelineProps) => {
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ sessionId: string; sessionNumber: number } | null>(null);

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
        // skip malformed JSON
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

        {sessions.map((s, index) => {
          const isActiveSession = Boolean(s.is_active) && index === sessions.length - 1;
          const archived = !isActiveSession ? archivedByOrdinal.get(s.session_number) : null;
          const displayScore    = isActiveSession ? activeScore    : archived?.score    ?? null;
          const displayReview   = isActiveSession ? activeReviewText : archived?.reviewText ?? null;

          return (
            <div key={s.id ?? s.session_number} className="group flex items-start gap-4 py-3">
              {/* Dot */}
              <div
                className={`relative z-10 mt-0.5 w-3.5 h-3.5 rounded-full shrink-0 border-2 transition-colors ${
                  isActiveSession
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/40'
                }`}
              />

              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                {/* Row header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-sm font-bold text-text-high">
                      {ordinal(s.session_number)} {noun}
                    </span>
                    {isActiveSession ? (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (() => {
                      const badge = statusBadge(archived?.finalStatus);
                      return (
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${badge.classes}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                    {displayScore && (
                      <span className="text-[10px] font-bold tracking-wider prismatic-text">
                        {displayScore}/10
                      </span>
                    )}
                  </div>

                  {!isActiveSession && s.id && onUpdateSession && (
                    <button
                      type="button"
                      onClick={() => setEditingSession(s)}
                      title="Edit past session"
                      className="text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all p-1 rounded-md hover:bg-primary/10 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  )}
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium">
                  <span>{formatPartialDate(s.start_date)}</span>
                  {s.finish_date && (
                    <>
                      <span className="text-outline-variant/60">→</span>
                      <span>{formatPartialDate(s.finish_date)}</span>
                    </>
                  )}
                  {!s.finish_date && isActiveSession && (
                    <>
                      <span className="text-outline-variant/60">→</span>
                      <span className="text-primary/70 italic">in progress</span>
                    </>
                  )}
                </div>

                {/* Review text */}
                {displayReview && (
                  <p className="selectable-text mt-1.5 text-sm text-text-high italic leading-relaxed border-l-2 border-outline-variant/30 pl-3">
                    "{displayReview}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onUpdateSession && (
        <EditSessionModal
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          session={editingSession}
          archivedEvaluation={editingSession ? archivedByOrdinal.get(editingSession.session_number) ?? null : null}
          sessionLabel={editingSession ? `${ordinal(editingSession.session_number)} ${noun}` : ''}
          releaseYear={releaseYear}
          onSave={onUpdateSession}
          onRequestDelete={(sessionId, sessionNumber) => {
            setPendingDelete({ sessionId, sessionNumber });
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!pendingDelete}
        title="Delete Past Session"
        message={pendingDelete ? `Are you sure you want to delete the ${ordinal(pendingDelete.sessionNumber)} ${noun.toLowerCase()}? This will permanently remove its dates, rating, and review from your history and adjust your rewatch count.` : ''}
        confirmLabel="Delete Session"
        type="danger"
        onConfirm={async () => {
          if (pendingDelete && onDeleteSession) {
            await onDeleteSession(pendingDelete.sessionId, pendingDelete.sessionNumber);
          }
          setPendingDelete(null);
          setEditingSession(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
