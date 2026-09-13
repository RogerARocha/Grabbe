import React, { useState } from 'react';
import { type LocalMatchItem, type UnlinkedMediaItem, type MergeOverrides } from '../../lib/db';
import { formatStatusLabel } from '../../lib/statusUtils';

export interface MergeDiscrepancyAnalysis {
  hasRealDiscrepancy: boolean;
  hasStatusConflict: boolean;
  hasProgressConflict: boolean;
  hasScoreConflict: boolean;
  hasDateConflict: boolean;
  autoOverrides: MergeOverrides;
}

export function getConsumptionDatesSummary(sessions?: Array<{ startDate: string | null; finishDate: string | null }>): {
  hasDates: boolean;
  startDate: string | null;
  finishDate: string | null;
  summaryText: string;
} {
  if (!sessions || sessions.length === 0) {
    return { hasDates: false, startDate: null, finishDate: null, summaryText: 'No dates set' };
  }

  const validStartDates = sessions.map(s => s.startDate).filter((d): d is string => Boolean(d && d.trim()));
  const validFinishDates = sessions.map(s => s.finishDate).filter((d): d is string => Boolean(d && d.trim()));

  if (validStartDates.length === 0 && validFinishDates.length === 0) {
    return { hasDates: false, startDate: null, finishDate: null, summaryText: 'No dates set' };
  }

  const startDate = validStartDates.length > 0 ? validStartDates[0] : null;
  const finishDate = validFinishDates.length > 0 ? validFinishDates[validFinishDates.length - 1] : null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  let summaryText = '';
  if (startDate && finishDate) {
    summaryText = `${formatDate(startDate)} – ${formatDate(finishDate)}`;
  } else if (startDate) {
    summaryText = `Started: ${formatDate(startDate)}`;
  } else if (finishDate) {
    summaryText = `Finished: ${formatDate(finishDate)}`;
  } else {
    summaryText = `${sessions.length} session(s)`;
  }

  return {
    hasDates: true,
    startDate,
    finishDate,
    summaryText
  };
}

/**
 * Analyzes unlinked entry vs candidate target entry to find true field discrepancies.
 * Discrepancies where one entry has no data (empty string, 0, null, no dates) are NOT treated as conflicts;
 * instead, the non-empty entry value is automatically selected.
 */
export function analyzeMergeDiscrepancies(
  unlinkedItem: {
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    totalProgressUnits?: number | null;
    total_progress?: number | null;
    sessions?: Array<{ startDate: string | null; finishDate: string | null }>;
  },
  targetMatch: {
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    totalProgressUnits?: number | null;
    total_progress?: number | null;
    sessions?: Array<{ startDate: string | null; finishDate: string | null }>;
  }
): MergeDiscrepancyAnalysis {
  const targetStatus = (targetMatch.status || '').trim();
  const sourceStatus = (unlinkedItem.status || '').trim();

  const targetProgress = targetMatch.progress || 0;
  const sourceProgress = unlinkedItem.progress || 0;

  const targetTotal = targetMatch.totalProgressUnits ?? targetMatch.total_progress ?? 0;
  const sourceTotal = unlinkedItem.totalProgressUnits ?? unlinkedItem.total_progress ?? 0;

  const targetScore = (targetMatch.score !== null && targetMatch.score !== undefined && targetMatch.score > 0) ? targetMatch.score : 0;
  const sourceScore = (unlinkedItem.score !== null && unlinkedItem.score !== undefined && unlinkedItem.score > 0) ? unlinkedItem.score : 0;

  const targetDates = getConsumptionDatesSummary(targetMatch.sessions);
  const sourceDates = getConsumptionDatesSummary(unlinkedItem.sessions);

  // Real conflicts exist ONLY if BOTH sides have valid non-empty entries AND they differ
  const hasStatusConflict = targetStatus !== '' && sourceStatus !== '' && targetStatus !== sourceStatus;
  const hasProgressConflict = targetProgress > 0 && sourceProgress > 0 && targetProgress !== sourceProgress;
  const hasScoreConflict = targetScore > 0 && sourceScore > 0 && targetScore !== sourceScore;
  const hasDateConflict = targetDates.hasDates && sourceDates.hasDates && (
    targetDates.startDate !== sourceDates.startDate || targetDates.finishDate !== sourceDates.finishDate
  );

  const hasRealDiscrepancy = hasStatusConflict || hasProgressConflict || hasScoreConflict || hasDateConflict;

  const autoOverrides: MergeOverrides = {};

  if (!hasStatusConflict) {
    if (sourceStatus !== '' && targetStatus === '') {
      autoOverrides.status = sourceStatus;
    } else if (targetStatus !== '') {
      autoOverrides.status = targetStatus;
    }
  }

  if (!hasProgressConflict) {
    if (sourceProgress > 0 && targetProgress === 0) {
      autoOverrides.progress = sourceProgress;
    } else if (targetProgress > 0) {
      autoOverrides.progress = targetProgress;
    }
  }

  if (sourceTotal > 0 && targetTotal === 0) {
    autoOverrides.totalProgress = sourceTotal;
  } else if (targetTotal > 0) {
    autoOverrides.totalProgress = targetTotal;
  }

  if (!hasScoreConflict) {
    if (sourceScore > 0 && targetScore === 0) {
      autoOverrides.score = sourceScore;
    } else if (targetScore > 0) {
      autoOverrides.score = targetScore;
    }
  }

  if (!hasDateConflict) {
    if (sourceDates.hasDates && !targetDates.hasDates) {
      autoOverrides.sessionPreference = 'source';
    } else if (targetDates.hasDates) {
      autoOverrides.sessionPreference = 'target';
    }
  }

  return {
    hasRealDiscrepancy,
    hasStatusConflict,
    hasProgressConflict,
    hasScoreConflict,
    hasDateConflict,
    autoOverrides,
  };
}

interface MergeConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlinkedItem: UnlinkedMediaItem;
  targetMatch: LocalMatchItem;
  onConfirmMerge: (overrides: MergeOverrides) => void;
}

export const MergeConflictModal: React.FC<MergeConflictModalProps> = ({
  isOpen,
  onClose,
  unlinkedItem,
  targetMatch,
  onConfirmMerge,
}) => {
  if (!isOpen) return null;

  const analysis = analyzeMergeDiscrepancies(unlinkedItem, targetMatch);

  const targetDates = getConsumptionDatesSummary(targetMatch.sessions);
  const sourceDates = getConsumptionDatesSummary(unlinkedItem.sessions);

  // Field Selection Modes: 'target' | 'source' | 'custom'
  const [statusMode, setStatusMode] = useState<'target' | 'source' | 'custom'>(
    targetMatch.status ? 'target' : unlinkedItem.status ? 'source' : 'target'
  );
  const [customStatus, setCustomStatus] = useState<string>(targetMatch.status || unlinkedItem.status || 'COMPLETED');

  const [progressMode, setProgressMode] = useState<'target' | 'source' | 'custom'>(
    (targetMatch.progress || 0) >= (unlinkedItem.progress || 0) ? 'target' : 'source'
  );
  const [customProgress, setCustomProgress] = useState<number>(
    Math.max(targetMatch.progress || 0, unlinkedItem.progress || 0)
  );

  const [scoreMode, setScoreMode] = useState<'target' | 'source' | 'custom'>(
    targetMatch.score ? 'target' : unlinkedItem.score ? 'source' : 'target'
  );
  const [customScore, setCustomScore] = useState<number>(targetMatch.score || unlinkedItem.score || 8);

  const [sessionPreference, setSessionPreference] = useState<'combine' | 'target' | 'source'>('combine');

  const handleConfirm = () => {
    const overrides: MergeOverrides = {};

    // Status
    if (statusMode === 'target') overrides.status = targetMatch.status || undefined;
    else if (statusMode === 'source') overrides.status = unlinkedItem.status || undefined;
    else overrides.status = customStatus;

    // Progress
    if (progressMode === 'target') overrides.progress = targetMatch.progress;
    else if (progressMode === 'source') overrides.progress = unlinkedItem.progress;
    else overrides.progress = customProgress;

    // Total progress preference
    overrides.totalProgress = targetMatch.totalProgress ?? unlinkedItem.totalProgress ?? null;

    // Score
    if (scoreMode === 'target') overrides.score = targetMatch.score;
    else if (scoreMode === 'source') overrides.score = unlinkedItem.score;
    else overrides.score = customScore;

    // Dates / Session preference
    overrides.sessionPreference = sessionPreference;

    onConfirmMerge(overrides);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-outline-variant/30 rounded-2xl bloom-shadow flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">call_merge</span>
            </div>
            <div>
              <h3 className="text-base font-black text-text-high tracking-tight">
                Resolve Merge Discrepancies
              </h3>
              <p className="text-xs text-text-muted">
                Choose values or specify custom details before consolidating entries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-text-muted hover:text-text-high hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Merge Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-14 shrink-0 rounded bg-background border border-outline-variant/10 overflow-hidden flex items-center justify-center">
                {unlinkedItem.coverImagePath ? (
                  <img src={unlinkedItem.coverImagePath} alt={unlinkedItem.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-sm text-text-muted">image</span>
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-primary tracking-wider block mb-0.5">
                  Unlinked Entry
                </span>
                <h5 className="text-xs font-bold text-text-high truncate">{unlinkedItem.title}</h5>
                <p className="text-[10px] text-text-muted mt-0.5">Sessions will be merged</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-outline-variant/10 pt-2 sm:pt-0 sm:pl-3">
              <div className="w-10 h-14 shrink-0 rounded bg-background border border-outline-variant/10 overflow-hidden flex items-center justify-center">
                {targetMatch.coverImagePath ? (
                  <img src={targetMatch.coverImagePath} alt={targetMatch.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-sm text-text-muted">image</span>
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] font-bold uppercase text-secondary tracking-wider block mb-0.5">
                  Target Linked Entry ({targetMatch.sourceApi})
                </span>
                <h5 className="text-xs font-bold text-text-high truncate">{targetMatch.title}</h5>
                <p className="text-[10px] text-text-muted mt-0.5">Official metadata destination</p>
              </div>
            </div>
          </div>

          {/* 1. Status Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-text-high flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">rule</span>
                <span>Consumption Status</span>
              </label>
              {analysis.hasStatusConflict && (
                <span className="text-[10px] font-bold text-warning uppercase px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20">
                  Different Values
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatusMode('target')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  statusMode === 'target'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-secondary mb-1">Target Entry</div>
                <div className="text-xs font-extrabold text-text-high">{formatStatusLabel(targetMatch.status)}</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusMode('source')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  statusMode === 'source'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-primary mb-1">Unlinked Entry</div>
                <div className="text-xs font-extrabold text-text-high">{formatStatusLabel(unlinkedItem.status)}</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusMode('custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  statusMode === 'custom'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-warning mb-1">Custom Status</div>
                <select
                  value={customStatus}
                  onChange={(e) => {
                    setStatusMode('custom');
                    setCustomStatus(e.target.value);
                  }}
                  className="w-full bg-background border border-outline-variant/30 text-text-high text-xs rounded p-1 focus:outline-none focus:border-primary cursor-pointer mt-0.5"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="CONSUMING">Watching / Reading</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DROPPED">Dropped</option>
                  <option value="PLANNING">Planning</option>
                </select>
              </button>
            </div>
          </div>

          {/* 2. Progress / Episodes Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-text-high flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">format_list_numbered</span>
                <span>Tracked Progress (Episodes / Units)</span>
              </label>
              {analysis.hasProgressConflict && (
                <span className="text-[10px] font-bold text-warning uppercase px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20">
                  Different Values
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProgressMode('target')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  progressMode === 'target'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-secondary mb-1">Target Entry</div>
                <div className="text-xs font-extrabold text-text-high">{targetMatch.progress} units</div>
              </button>

              <button
                type="button"
                onClick={() => setProgressMode('source')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  progressMode === 'source'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-primary mb-1">Unlinked Entry</div>
                <div className="text-xs font-extrabold text-text-high">{unlinkedItem.progress} units</div>
              </button>

              <div
                onClick={() => setProgressMode('custom')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  progressMode === 'custom'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-warning mb-1">Custom Progress</div>
                <input
                  type="number"
                  min="0"
                  value={customProgress}
                  onFocus={() => setProgressMode('custom')}
                  onChange={(e) => {
                    setProgressMode('custom');
                    setCustomProgress(Math.max(0, parseInt(e.target.value) || 0));
                  }}
                  className="w-full bg-background border border-outline-variant/30 text-text-high text-xs rounded p-1 focus:outline-none focus:border-primary"
                  placeholder="Custom number"
                />
              </div>
            </div>
          </div>

          {/* 3. Consumption Dates & Sessions Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-text-high flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">calendar_month</span>
                <span>Consumption Dates & Sessions</span>
              </label>
              {analysis.hasDateConflict && (
                <span className="text-[10px] font-bold text-warning uppercase px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20">
                  Different Values
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSessionPreference('combine')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sessionPreference === 'combine'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-primary mb-1">Combine Both (Recommended)</div>
                <div className="text-xs font-extrabold text-text-high">Keep All Sessions</div>
              </button>

              <button
                type="button"
                onClick={() => setSessionPreference('target')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sessionPreference === 'target'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-secondary mb-1">Target Entry Dates</div>
                <div className="text-xs font-extrabold text-text-high truncate">{targetDates.summaryText}</div>
              </button>

              <button
                type="button"
                onClick={() => setSessionPreference('source')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sessionPreference === 'source'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-primary mb-1">Unlinked Entry Dates</div>
                <div className="text-xs font-extrabold text-text-high truncate">{sourceDates.summaryText}</div>
              </button>
            </div>
          </div>

          {/* 4. Rating / Score Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-text-high flex items-center gap-2">
                <span className="material-symbols-outlined text-warning text-[16px]">star</span>
                <span>User Rating / Score</span>
              </label>
              {analysis.hasScoreConflict && (
                <span className="text-[10px] font-bold text-warning uppercase px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20">
                  Different Values
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScoreMode('target')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scoreMode === 'target'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-secondary mb-1">Target Entry</div>
                <div className="text-xs font-extrabold text-warning">
                  {targetMatch.score ? `★ ${targetMatch.score}/10` : 'No score set'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScoreMode('source')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scoreMode === 'source'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-primary mb-1">Unlinked Entry</div>
                <div className="text-xs font-extrabold text-warning">
                  {unlinkedItem.score ? `★ ${unlinkedItem.score}/10` : 'No score set'}
                </div>
              </button>

              <div
                onClick={() => setScoreMode('custom')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  scoreMode === 'custom'
                    ? 'bg-primary/15 border-primary text-text-high bloom-shadow'
                    : 'bg-surface-container/50 border-outline-variant/15 text-text-muted hover:border-outline-variant/40'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-warning mb-1">Custom Rating</div>
                <select
                  value={customScore}
                  onFocus={() => setScoreMode('custom')}
                  onChange={(e) => {
                    setScoreMode('custom');
                    setCustomScore(parseInt(e.target.value) || 0);
                  }}
                  className="w-full bg-background border border-outline-variant/30 text-text-high text-xs rounded p-1 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>
                      ★ {s}/10
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high text-text-high text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-extrabold active:scale-95 bloom-shadow transition-all hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">call_merge</span>
            <span>Confirm & Merge Entries</span>
          </button>
        </div>

      </div>
    </div>
  );
};
