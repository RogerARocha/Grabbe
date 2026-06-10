import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLibraryItems } from '../../lib/db';
import { MediaCard } from '../shared/MediaCard';
import type { MediaStatus, MediaType } from '../shared/types';
import { Pagination } from '../shared/Pagination';
import { useLibraryStore } from '../../store/libraryStore';
import { filterAndSortLibraryItems } from '../../lib/libraryUtils';

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
  const { currentPage, setCurrentPage } = useLibraryStore();
  const [data, setData] = useState<any[]>([]);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    getLibraryItems().then(items => {
      setData(items || []);
    });
  }, [activeTab, activeStatus]);

  /**
   * O(N) cross-filtering, search, and sort pipeline.
   * All transforms are memoized so they only recompute when inputs change.
   */
  const processedData = useMemo(() => {
    return filterAndSortLibraryItems(data, activeTab, activeStatus, searchQuery, sortBy);
  }, [data, activeTab, activeStatus, searchQuery, sortBy]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const displayedItems = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
              image={item.cover_image_path || null}
              status={item.status}
              typeBadge={item.type}
              onClick={() => navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`, { state: { from: 'Library', path: '/library' } })}
            />
          );
        })}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
};
