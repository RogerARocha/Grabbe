const GENRE_COLORS = [
  'bg-secondary/15 text-secondary',
  'bg-primary/15 text-primary',
  'bg-tertiary/15 text-tertiary',
  'bg-warning/15 text-warning',
];

/** Human-readable ordinal suffix: 1 → "1st", 2 → "2nd", 3 → "3rd", 4+ → "Nth". */
function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Returns the session label noun based on media type. */
function sessionNoun(mediaType?: string): string {
  switch (mediaType?.toUpperCase()) {
    case 'GAME': return 'Playthrough';
    case 'BOOK':
    case 'MANGA':
    case 'COMIC': return 'Read';
    default: return 'Watch';
  }
}

interface MediaHeaderProps {
  title: string;
  genres: string[];
  year: number | null;
  runtime?: string;
  externalRating?: number;
  ratingSource?: string;
  /** The current rewatch count from UserTracking. Badge only renders when > 0. */
  rewatchCount?: number;
  /** Media type used to derive the session label noun (e.g. "2nd Playthrough"). */
  mediaType?: string;
}

/**
 * Displays the media title, genre chips, metadata row, and optional rewatch badge.
 * The rewatch badge is shown only when `rewatchCount` is greater than zero.
 */
export const MediaHeader = ({
  title,
  genres,
  year,
  runtime,
  externalRating,
  ratingSource,
  rewatchCount,
  mediaType,
}: MediaHeaderProps) => {
  const showRewatchBadge = rewatchCount !== undefined && rewatchCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="selectable-text text-5xl font-extrabold tracking-tighter text-text-high leading-none">{title}</h1>

          {showRewatchBadge && (
            <div className="flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-secondary/10 border border-secondary/25 bloom-shadow">
              <span
                className="material-symbols-outlined text-secondary text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                replay
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary">
                {ordinalSuffix(rewatchCount! + 1)} {sessionNoun(mediaType)}
              </span>
            </div>
          )}
        </div>

        {externalRating && (
          <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/10 shrink-0">
            <span className="material-symbols-outlined text-[#b58900]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-xl font-black text-text-high">{externalRating}</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{ratingSource}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {genres.map((genre, i) => (
          <span key={genre} className={`${GENRE_COLORS[i % GENRE_COLORS.length]} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
            {genre}
          </span>
        ))}
        {year && (
          <>
            <div className="h-1 w-1 bg-outline-variant rounded-full" />
            <span className="text-text-muted text-sm font-medium">{year}</span>
          </>
        )}
        {runtime && (
          <>
            <div className="h-1 w-1 bg-outline-variant rounded-full" />
            <span className="text-text-muted text-sm font-medium">{runtime}</span>
          </>
        )}
      </div>
    </div>
  );
};
