import type { MediaStatus, MediaType } from '../components/shared/types';

export interface LibraryItem {
  id: string;
  external_id: string;
  source_api: string;
  type: MediaType;
  status: MediaStatus;
  title: string;
  genres?: string;
  franchise?: string;
  cover_image_path?: string | null;
  release_date?: string | null;
  progress: number;
  total_progress?: number;
  created_at?: string;
  finish_date?: string;
  updated_at?: string;
}

/**
 * Normalises and filters/sorts library items in memory.
 * Applies cross-filtering by type and status, full-text search across
 * title/genre/franchise, and multi-mode sorting.
 *
 * @param items Array of raw library items
 * @param activeTab The active media type tab (e.g. ALL, MOVIE, GAME)
 * @param activeStatus The active tracking status filter (e.g. ALL, COMPLETED)
 * @param searchQuery The search query string for fuzzy search
 * @param sortBy Sorting strategy key
 * @returns Sorted and filtered array of library items
 */
export function filterAndSortLibraryItems(
  items: LibraryItem[],
  activeTab: MediaType,
  activeStatus: MediaStatus | 'ALL',
  searchQuery: string,
  sortBy: string
): LibraryItem[] {
  // Filter by type and status
  let result = items.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.type === activeTab;
    const matchesStatus = activeStatus === 'ALL' || item.status === activeStatus;
    return matchesTab && matchesStatus;
  });

  // Filter by search query (title, genres, franchise)
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
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      case 'first_added':
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      case 'az':
        return (a.title ?? '').localeCompare(b.title ?? '');
      case 'za':
        return (b.title ?? '').localeCompare(a.title ?? '');
      case 'last_finished': {
        const parseSafeTime = (val: any): number => {
          if (!val) return 0;
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          const str = String(val);
          return new Date(str.includes(' ') ? str.replace(' ', 'T') + 'Z' : str).getTime();
        };
        const dateA = parseSafeTime(a.finish_date);
        const dateB = parseSafeTime(b.finish_date);

        if (dateA === 0 && dateB === 0) return 0;
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;

        return dateB - dateA;
      }
      case 'first_finished': {
        const parseSafeTime = (val: any): number => {
          if (!val) return 0;
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          const str = String(val);
          return new Date(str.includes(' ') ? str.replace(' ', 'T') + 'Z' : str).getTime();
        };
        const dateA = parseSafeTime(a.finish_date);
        const dateB = parseSafeTime(b.finish_date);

        if (dateA === 0 && dateB === 0) return 0;
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;

        return dateA - dateB;
      }
      case 'last_updated':
      default:
        return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
    }
  });

  return result;
}
