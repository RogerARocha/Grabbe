import { MediaType, MediaStatus } from '../shared/types';
import { TypeFilters } from '../shared/TypeFilters';

interface LibraryFiltersProps {
  activeTab: MediaType;
  setActiveTab: (tab: MediaType) => void;
  activeStatus: MediaStatus | 'ALL';
  setActiveStatus: (status: MediaStatus | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const STATUS_FILTERS: (MediaStatus | 'ALL')[] = ['ALL', 'CONSUMING', 'PLANNED', 'ON HOLD', 'COMPLETED', 'DROPPED'];

/**
 * Renders the top-level type and status filter controls, search bar, and sorting controls for the library view.
 */
export const LibraryFilters = ({
  activeTab,
  setActiveTab,
  activeStatus,
  setActiveStatus,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy
}: LibraryFiltersProps) => {

  return (
    <div className="space-y-6 mb-12">
      <TypeFilters activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map(status => {
            const isActive = activeStatus === status;

            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${isActive
                    ? 'bg-surface-container-highest text-text-high border border-outline-variant/30 shadow-sm'
                    : 'bg-surface-container text-text-muted border border-transparent hover:bg-surface-container-highest hover:text-text-high'
                  }`}
              >
                {status === 'ALL' ? 'ALL STATUS' : status}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search input with leading icon */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined text-[18px] text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              placeholder="Search by title, genre, franchise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/10 rounded-xl pl-10 pr-4 py-2 text-sm text-text-high placeholder-text-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {/* Sort dropdown select */}
          <div className="relative w-full sm:w-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-surface-container border border-outline-variant/10 rounded-xl pl-4 pr-10 py-2 text-sm text-text-high font-semibold cursor-pointer focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all select-none"
            >
              <option value="last_added">Last Added</option>
              <option value="last_updated">Last Updated</option>
              <option value="first_added">First Added</option>
              <option value="az">Alphabetical (A - Z)</option>
              <option value="za">Alphabetical (Z - A)</option>
            </select>
            <span className="material-symbols-outlined text-[18px] text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};