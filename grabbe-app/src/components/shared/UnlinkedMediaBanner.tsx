import React from 'react';

interface UnlinkedMediaBannerProps {
  unlinkedCount: number;
  onOpenAssistant: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Organic, non-intrusive banner notification displayed when unlinked media entries
 * exist in the user's library. Offers a 1-click CTA to launch the interactive fix assistant.
 */
export const UnlinkedMediaBanner: React.FC<UnlinkedMediaBannerProps> = ({
  unlinkedCount,
  onOpenAssistant,
  onDismiss,
  className = ''
}) => {
  if (unlinkedCount <= 0) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-primary/30 bg-surface/90 backdrop-blur-md p-4 bloom-shadow transition-all duration-300 border-l-4 border-l-primary ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
            <span className="material-symbols-outlined text-primary text-[22px] animate-pulse">
              auto_fix_high
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-high tracking-tight">
                {unlinkedCount} {unlinkedCount === 1 ? 'item needs' : 'items need'} metadata linking
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
                Action Suggested
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Some entries lack official metadata or covers. Review them to unlock rich stats, posters, and synced details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <button
            onClick={onOpenAssistant}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg primary-glow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
          >
            <span>Review & Link</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              title="Dismiss notification for this session"
              className="w-10 h-10 rounded-xl bg-surface-container/40 border border-outline-variant/15 flex items-center justify-center text-text-muted hover:text-text-high hover:bg-surface-container hover:border-outline-variant/30 transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
