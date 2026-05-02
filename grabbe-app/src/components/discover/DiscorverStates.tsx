export const SkeletonCard = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="aspect-[2/3] rounded-lg bg-surface-container" />
    <div className="px-1 space-y-2">
      <div className="h-3 w-3/4 bg-surface-container rounded" />
      <div className="h-2 w-1/2 bg-surface-container rounded" />
    </div>
  </div>
);

export const EmptyState = ({ query }: { query: string }) => (
  <div className="flex flex-col items-center justify-center py-32 text-center">
    <div className="relative mb-8">
      <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center bloom-shadow">
        <span className="material-symbols-outlined text-4xl text-text-muted">search_off</span>
      </div>
      <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center border border-tertiary/30">
        <span className="material-symbols-outlined text-sm text-tertiary">close</span>
      </div>
    </div>
    <h3 className="text-xl font-bold text-text-high mb-2">
      No results for <span className="prismatic-text">"{query}"</span>
    </h3>
    <p className="text-sm text-text-muted max-w-sm">
      Try a different title, or change the media type filter. The BFF searches TMDB, Jikan, and Google Books simultaneously.
    </p>
  </div>
);

export const IdleState = () => (
  <div className="flex flex-col items-center justify-center py-32 text-center">
    <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center bloom-shadow mb-8">
      <span className="material-symbols-outlined text-4xl text-primary">
        travel_explore
      </span>
    </div>
    <h3 className="text-2xl font-black tracking-tight text-text-high mb-3">
      Discover the Universe
    </h3>
    <p className="text-sm text-text-muted max-w-md leading-relaxed">
      Find any movie, series, anime, manga, book, or game. Results are pulled concurrently via the Grabbe BFF.
    </p>
    <div className="grid grid-cols-3 gap-4 mt-12 max-w-sm w-full">
          {[
            { icon: 'movie', label: 'Movies & Series', color: 'text-primary', bg: 'bg-primary/10' },
            { icon: 'auto_awesome', label: 'Anime & Manga', color: 'text-warning', bg: 'bg-warning/10' },
            { icon: 'book', label: 'Books & Games', color: 'text-secondary', bg: 'bg-secondary/10' },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4 flex flex-col items-center gap-2 border border-outline-variant/10`}>
              <span className={`material-symbols-outlined ${item.color} text-2xl`}>{item.icon}</span>
              <p className={`text-[10px] font-bold ${item.color} uppercase tracking-wider text-center leading-tight`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
  </div>
);