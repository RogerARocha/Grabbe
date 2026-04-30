export const LibraryFilters = () => {
  return (
    <div className="space-y-6 mb-12">
      {/* Top Level Media Categories */}
      <div className="flex items-center gap-2 border-b border-outline-variant/10">
        <button className="px-6 py-3 bg-surface border-b-2 border-tertiary text-text-high font-semibold text-sm transition-all duration-200">
          All
        </button>
        {['Films','Series', 'Games', 'Animes', 'Books'].map(cat => (
          <button key={cat} className="px-6 py-3 text-text-muted hover:text-text-high font-medium text-sm transition-all duration-200 hover:bg-surface-container">
            {cat}
          </button>
        ))}
      </div>

      {/* Secondary Status Filters */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-1.5 rounded-full bg-surface-container-highest text-text-high text-xs font-bold tracking-wide border border-outline-variant/30 hover:bg-primary/20 hover:border-primary/40 transition-all">
          ALL STATUS
        </button>
        {['CONSUMING', 'PLANNED', 'COMPLETED', 'DROPPED'].map(status => (
          <button key={status} className="px-4 py-1.5 rounded-full bg-surface-container text-text-muted text-xs font-bold tracking-wide border border-transparent hover:bg-surface-container-highest hover:text-text-high transition-all">
            {status}
          </button>
        ))}
      </div>
    </div>
  );
};
