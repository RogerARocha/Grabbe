import { openUrl } from '@tauri-apps/plugin-opener';

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

interface ApiRef {
  logo: string;
  url: string;
  name: string;
}

const API_REFS: Record<string, ApiRef> = {
  TMDB: {
    logo: '/ref-logos/blue_square_2-themoviedb-logo.svg',
    url: 'https://www.themoviedb.org',
    name: 'TMDB'
  },
  JIKAN: {
    logo: '/ref-logos/jikan.f848d5d6.svg',
    url: 'https://jikan.moe',
    name: 'Jikan'
  },
  IGDB: {
    logo: '/ref-logos/IgdbLogo.svg',
    url: 'https://www.igdb.com',
    name: 'IGDB'
  },
  OPENLIBRARY: {
    logo: '/ref-logos/openlibrary-logo-tighter.svg',
    url: 'https://openlibrary.org',
    name: 'Open Library'
  }
};

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
  const apiInfo = ratingSource ? API_REFS[ratingSource.toUpperCase()] : null;

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

        {((externalRating !== undefined && externalRating !== null) || apiInfo) && (
          apiInfo ? (
            <a
              href={apiInfo.url}
              onClick={(e) => {
                e.preventDefault();
                openUrl(apiInfo.url).catch(err => {
                  console.error('Failed to open URL via Tauri:', err);
                  window.open(apiInfo.url, '_blank', 'noopener,noreferrer');
                });
              }}
              title={`View on ${apiInfo.name}`}
              className="flex items-center gap-3 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-full border border-outline-variant/10 shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#b58900] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-xl font-black text-text-high">
                {externalRating !== undefined && externalRating !== null ? externalRating : '—'}
              </span>
              <div className="w-[1px] h-4 bg-outline-variant/40" />
              <img src={apiInfo.logo} alt={apiInfo.name} className="h-4.5 w-auto object-contain brightness-90 group-hover:brightness-100 transition-all" />
            </a>
          ) : (
            <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/10 shrink-0">
              <span className="material-symbols-outlined text-[#b58900]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-xl font-black text-text-high">{externalRating}</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{ratingSource}</span>
            </div>
          )
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
