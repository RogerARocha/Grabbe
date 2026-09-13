import React from 'react';

interface MetadataLinkerProps {
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  handleQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectResult: (result: any) => void;
  searchType?: string;
  onTypeChange?: (type: string) => void;
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'MOVIE', label: 'Film' },
  { value: 'SERIES', label: 'Series' },
  { value: 'ANIME', label: 'Anime' },
  { value: 'MANGA', label: 'Manga' },
  { value: 'BOOK', label: 'Book' },
  { value: 'GAME', label: 'Game' },
];

/**
 * Presentation component displayed when a media is a basic imported placeholder.
 * Renders the search-and-link UI block to link manual entries with rich metadata.
 */
export const MetadataLinker = ({
  searchQuery,
  searchResults,
  isSearching,
  showDropdown,
  setShowDropdown,
  handleQueryChange,
  handleSelectResult,
  searchType = 'ALL',
  onTypeChange
}: MetadataLinkerProps) => {
  return (
    <div className="max-w-2xl p-5 border border-sky-500/30 bg-sky-500/10 rounded-xl flex flex-col gap-4">
      <p className="text-sm text-text-base font-medium leading-relaxed">
        We couldn't find the online details (poster, synopsis) for this media. You can search and link it manually below without limitations or filter by type.
      </p>

      {/* Type Filter Pills */}
      {onTypeChange && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-1">
            Filter:
          </span>
          {TYPE_OPTIONS.map((opt) => {
            const isActive = searchType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTypeChange(opt.value)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                    : 'bg-background/80 hover:bg-background text-text-muted hover:text-text-high border border-outline-variant/20'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 relative">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sky-400">search</span>
          <input
            type="text"
            placeholder={searchType === 'ALL' ? 'Search across all providers to link...' : `Search in ${searchType.toLowerCase()}s to link...`}
            className="w-full bg-background border border-sky-500/30 text-text-high text-sm pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
            value={searchQuery}
            onChange={handleQueryChange}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          />
          {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />}
        </div>
        
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-surface rounded-lg border border-outline-variant/30 overflow-hidden z-50 max-h-60 overflow-y-auto bloom-shadow">
            {searchResults.map((res) => (
              <div 
                key={res.externalId} 
                onClick={() => handleSelectResult(res)}
                className="flex gap-3 p-3 cursor-pointer hover:bg-surface-container transition-colors border-b border-outline-variant/10 last:border-0"
              >
                {res.coverImageUrl ? (
                  <img src={res.coverImageUrl} className="w-10 h-14 object-cover rounded bg-background" alt="" />
                ) : (
                  <div className="w-10 h-14 bg-background rounded flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-text-muted">image</span>
                  </div>
                )}
                <div className="flex flex-col justify-center overflow-hidden">
                  <span className="text-sm font-bold text-text-high truncate">{res.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase text-text-muted bg-background px-1.5 py-0.5 rounded">{res.type}</span>
                    <span className="text-[10px] text-text-muted">{res.releaseDate?.substring(0, 4) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
