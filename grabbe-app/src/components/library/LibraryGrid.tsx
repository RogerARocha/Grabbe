import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLibraryItems } from '../../lib/db';
import { MediaCard } from '../shared/MediaCard';
import type { MediaStatus, MediaType } from '../shared/types';


interface LibraryGridProps {
  activeTab: MediaType;
  activeStatus: MediaStatus | 'ALL';
  searchQuery: string;
  sortBy: string;
}

/**
 * Displays the library collection as a responsive grid of media cards.
 * Implements client-side cross-filtering by type and status, full-text
 * search across title/genre/franchise fields, and multi-mode sorting.
 */
export const LibraryGrid = ({ activeTab, activeStatus, searchQuery, sortBy }: LibraryGridProps) => {
  const [displayCount, setDisplayCount] = useState(12);
  const [data, setData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getLibraryItems().then(items => {
      setData(items || []);
    });
    // Reset pagination when filters change
    setDisplayCount(12);
  }, [activeTab, activeStatus]);

  // Also reset pagination on search/sort change
  useEffect(() => {
    setDisplayCount(12);
  }, [searchQuery, sortBy]);

  /**
   * O(N) cross-filtering, search, and sort pipeline.
   * All transforms are memoized so they only recompute when inputs change.
   */
  const processedData = useMemo(() => {
    //Filter by type and status
    let result = data.filter(item => {
      const matchesTab = activeTab === 'ALL' || item.type === activeTab;
      const matchesStatus = activeStatus === 'ALL' || item.status === activeStatus;
      return matchesTab && matchesStatus;
    });

    //Filter by search query (title, genres, franchise)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(item => {
        const inTitle = item.title?.toLowerCase().includes(q);
        const inGenres = item.genres?.toLowerCase().includes(q);
        const inFranchise = item.franchise?.toLowerCase().includes(q);
        return inTitle || inGenres || inFranchise;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'last_added':
          // Media.created_at DESC — newest item added first
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        case 'first_added':
          // Media.created_at ASC — oldest item added first
          return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
        case 'az':
          return (a.title ?? '').localeCompare(b.title ?? '');
        case 'za':
          return (b.title ?? '').localeCompare(a.title ?? '');
        case 'last_updated':
        default:
          // UserTracking.updated_at DESC — matches the default DB order
          return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
      }
    });

    return result;
  }, [data, activeTab, activeStatus, searchQuery, sortBy]);

  const displayedItems = processedData.slice(0, displayCount);
  const hasMore = displayCount < processedData.length;

  if (processedData.length === 0) {
    const isSearching = searchQuery.trim().length > 0;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6 border border-outline-variant/20">
          <span className="material-symbols-outlined text-3xl text-text-muted">
            {isSearching ? 'search_off' : 'folder_off'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-text-high mb-2">
          {isSearching ? `No results for "${searchQuery}"` : 'No entries found'}
        </h3>
        <p className="text-sm text-text-muted">
          {isSearching
            ? 'Try a different title, genre, or franchise name.'
            : 'Try changing your filters or add new media from the Discover page.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {displayedItems.map(item => {
          const typeCapitalized = item.type.charAt(0) + item.type.slice(1).toLowerCase();
          const releaseYear = item.release_date ? String(item.release_date).substring(0, 4) : null;
          const extraInfo = releaseYear || `${item.progress} / ${item.total_progress || '?'}`;
          const finalSubtitle = `${typeCapitalized} • ${extraInfo}`;

          return (
            <MediaCard 
              key={item.id} 
              variant="library" 
              title={item.title}
              subtitle={finalSubtitle}
              image={item.cover_image_path}
              status={item.status}
              typeBadge={item.type}
              onClick={() => navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`, { state: { from: 'Library', path: '/library' } })}
            />
          );
        })}
      </div>
      
      {hasMore && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => setDisplayCount(prev => prev + 12)}
            className="flex items-center gap-2 px-8 py-4 bg-surface-container-high rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all duration-300 group text-text-high"
          >
            Load More Entries
            <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">expand_more</span>
          </button>
        </div>
      )}
    </>
  );
};
