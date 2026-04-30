const GENRE_COLORS = [
  'bg-secondary/15 text-secondary',
  'bg-primary/15 text-primary',
  'bg-tertiary/15 text-tertiary',
  'bg-warning/15 text-warning',
];

interface MediaHeaderProps {
  title: string;
  genres: string[];
  year: number | null;
  runtime?: string;
  externalRating?: number;
  ratingSource?: string;
}

export const MediaHeader = ({ title, genres, year, runtime, externalRating, ratingSource }: MediaHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-6">
        <h1 className="text-5xl font-extrabold tracking-tighter text-text-high leading-none">{title}</h1>
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
            <div className="h-1 w-1 bg-outline-variant rounded-full"></div>
            <span className="text-text-muted text-sm font-medium">{year}</span>
          </>
        )}
        {runtime && (
          <>
            <div className="h-1 w-1 bg-outline-variant rounded-full"></div>
            <span className="text-text-muted text-sm font-medium">{runtime}</span>
          </>
        )}
      </div>
    </div>
  );
};
