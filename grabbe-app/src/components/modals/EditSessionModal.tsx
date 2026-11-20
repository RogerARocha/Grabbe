import { useEffect, useState } from 'react';
import { PartialDateInput, parsePartialDate, partialDateToInt } from '../shared/PartialDateInput';
import { SCORE_OPTIONS } from '../../lib/scoreUtils';
import type { PastSessionUpdate } from '../../lib/db';

export interface EditableSession {
  id?: string;
  session_number: number;
  start_date: string | null;
  finish_date: string | null;
}

export interface ArchivedSessionEvaluation {
  score: number | null;
  reviewText: string | null;
  finalStatus?: string;
}

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: EditableSession | null;
  archivedEvaluation: ArchivedSessionEvaluation | null;
  sessionLabel: string;
  releaseYear?: number;
  onSave: (sessionId: string, sessionNumber: number, payload: PastSessionUpdate) => Promise<void>;
  onRequestDelete: (sessionId: string, sessionNumber: number) => void;
}

/**
 * Modal for editing or deleting a past (archived) consumption session.
 */
export const EditSessionModal = ({
  isOpen,
  onClose,
  session,
  archivedEvaluation,
  sessionLabel,
  releaseYear,
  onSave,
  onRequestDelete,
}: EditSessionModalProps) => {
  const [finalStatus, setFinalStatus] = useState('COMPLETED');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      setFinalStatus(archivedEvaluation?.finalStatus || 'COMPLETED');
      setStartDate(parsePartialDate(session.start_date || undefined));
      setFinishDate(parsePartialDate(session.finish_date || undefined));
      setSelectedScore(archivedEvaluation?.score ?? null);
      setReviewText(archivedEvaluation?.reviewText ?? '');
      setIsScoreOpen(false);
    }
  }, [isOpen, session, archivedEvaluation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !session || !session.id) return null;

  const validDate = (d: string): string | null => (d && d.length >= 4 ? d : null);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (finishDate && val.length >= 4 && partialDateToInt(val) > partialDateToInt(finishDate)) {
      setFinishDate('');
    }
  };

  const handleSave = async () => {
    if (!session.id || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(session.id, session.session_number, {
        startDate: validDate(startDate),
        finishDate: validDate(finishDate),
        score: selectedScore,
        reviewText: reviewText.trim() ? reviewText : null,
        finalStatus,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[420px] bg-surface rounded-[12px] p-6 bloom-shadow flex flex-col gap-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto z-10"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-high tracking-tight">Edit Past Session</h2>
            <p className="text-xs text-text-muted mt-0.5">{sessionLabel}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Final Status</label>
            <div className="relative">
              <select
                value={finalStatus}
                onChange={(e) => setFinalStatus(e.target.value)}
                className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 appearance-none focus:ring-2 focus:ring-primary transition-all cursor-pointer text-text-high outline-none"
              >
                <option value="COMPLETED">Completed</option>
                <option value="ON HOLD">On Hold</option>
                <option value="DROPPED">Dropped</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <PartialDateInput
              value={startDate}
              onChange={handleStartDateChange}
              label="Start Date"
              minYear={releaseYear}
            />
            <PartialDateInput
              value={finishDate}
              onChange={setFinishDate}
              label="Finish Date"
              minYear={releaseYear}
              minPartialDate={startDate.length >= 4 ? startDate : undefined}
              onCopyFrom={startDate ? () => setFinishDate(startDate) : undefined}
              copyFromLabel="Copy Start"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsScoreOpen(!isScoreOpen)}>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted cursor-pointer">Archived Rating</label>
              <div className="flex items-center gap-2">
                {selectedScore !== null && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScore(null);
                    }}
                    className="px-2 py-0.5 rounded bg-surface-container text-text-muted hover:text-error text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Clear
                  </button>
                )}
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Select Score
                </span>
                <span className="text-primary font-bold text-xs">{selectedScore ? selectedScore : '-'}/10</span>
                <span className="material-symbols-outlined text-text-muted text-[18px]">
                  {isScoreOpen ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </div>

            {isScoreOpen && (
              <div className="mt-1 bg-background rounded-lg border border-outline-variant/30 overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  {SCORE_OPTIONS.map((score) => (
                    <div
                      key={score.value}
                      onClick={() => {
                        setSelectedScore(score.value);
                        setIsScoreOpen(false);
                      }}
                      className={`px-4 py-2.5 flex items-center justify-between group cursor-pointer border-b border-outline-variant/10 last:border-0 ${score.bgHoverClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${score.colorClass}`}>({score.value})</span>
                        <span className={`text-sm font-medium transition-colors ${score.colorClass.includes('prismatic') ? score.colorClass : `text-text-high ${score.colorClass.replace('text-', 'group-hover:text-')}`}`}>
                          {score.label}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-xs ${score.colorClass} ${selectedScore === score.value ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        check_circle
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Archived Review & Notes</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think during this session?"
              className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none resize-none min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-outline-variant/10 mt-2">
          <button
            type="button"
            onClick={() => onRequestDelete(session.id!, session.session_number)}
            className="px-3 py-2 text-xs font-bold text-error hover:bg-error/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-text-muted hover:text-text-high transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-secondary hover:brightness-110 disabled:opacity-50 text-[#00412a] text-sm font-bold rounded-lg transition-all active:scale-95 bloom-shadow"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
