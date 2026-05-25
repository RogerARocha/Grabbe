import { formatStatusLabel } from '../../lib/statusUtils';

/**
 * Returns the context-aware label for the rewatch action button based on media type.
 * Games use "Play Again"; all other media types default to "Rewatch / Reread" variants.
 */
function getRewatchLabel(mediaType?: string): string {
  switch (mediaType?.toUpperCase()) {
    case 'GAME':
      return 'Play Again';
    case 'BOOK':
    case 'MANGA':
    case 'COMIC':
      return 'Reread';
    default:
      return 'Rewatch';
  }
}

interface ActionBarProps {
  isInLibrary: boolean;
  status?: string;
  userScore?: number;
  mediaType?: string;
  onAdd: () => void;
  onUpdate: () => void;
  onRemove: () => void;
  /** Called when the user confirms a new rewatch/replay session. */
  onRewatch?: () => void;
}

/**
 * Renders the primary action controls for the media detail view.
 * When the item is in the library and its status is COMPLETED, DROPPED, or ON HOLD,
 * also renders the context-aware "Rewatch / Reread / Play Again" secondary CTA.
 */
export const ActionBar = ({
  isInLibrary,
  status,
  userScore,
  mediaType,
  onAdd,
  onUpdate,
  onRemove,
  onRewatch,
}: ActionBarProps) => {
  if (isInLibrary) {
    const canRestart = status === 'COMPLETED' || status === 'DROPPED' || status === 'ON HOLD';

    return (
      <div className="flex flex-wrap items-center gap-4 pt-4">
        <button
          onClick={onUpdate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/20 transition-all group"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-bold text-primary">
            {status ? formatStatusLabel(status, mediaType) : formatStatusLabel('CONSUMING', mediaType)}
          </span>
          <span className="material-symbols-outlined text-primary text-lg">expand_more</span>
        </button>

        <button
          onClick={onUpdate}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant/10 rounded-lg cursor-pointer hover:border-tertiary/50 transition-all"
        >
          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">My Score</span>
          <span className="text-sm font-black prismatic-text">{userScore ?? '-'}/10</span>
        </button>

        {canRestart && onRewatch && (
          <button
            onClick={onRewatch}
            className="flex items-center gap-2 px-5 py-2 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg cursor-pointer hover:bg-secondary/20 active:scale-95 transition-all group"
          >
            <span
              className="material-symbols-outlined text-lg group-hover:rotate-[-20deg] transition-transform duration-200"
            >
              replay
            </span>
            <span className="text-sm font-bold">{getRewatchLabel(mediaType)}</span>
          </button>
        )}

        <button
          onClick={onRemove}
          className="text-xs font-bold text-text-muted hover:text-error transition-colors px-2 py-1"
        >
          Remove
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button className="p-3 rounded-lg bg-surface-container border border-outline-variant/10 text-text-muted hover:text-text-high transition-all">
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 pt-4">
      <button
        onClick={onAdd}
        className="bg-primary hover:brightness-110 text-on-primary font-bold px-12 py-4 rounded-lg transition-all flex items-center gap-3 primary-glow group min-w-[200px] justify-center active:scale-95"
      >
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
        Add to List
      </button>
      <button className="p-4 rounded-lg bg-surface-container border border-outline-variant/10 text-text-muted hover:text-text-high transition-all">
        <span className="material-symbols-outlined">share</span>
      </button>
    </div>
  );
};
