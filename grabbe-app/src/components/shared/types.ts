/**
 * Represents the current user tracking state for a media item.
 */
export type MediaStatus = 'CONSUMING' | 'COMPLETED' | 'DROPPED' | 'PLANNED' | 'ON HOLD' | 'PENDING';

/**
 * Defines the supported media types across the platform.
 */
export type MediaType = 'ALL' | 'MOVIE' | 'SERIES' | 'ANIME' | 'MANGA' | 'BOOK' | 'GAME';

/**
 * Configuration for type filter UI elements.
 */
export const TYPE_FILTERS: { label: string; value: MediaType; icon: string }[] = [
  { label: 'All', value: 'ALL', icon: 'grid_view' },
  { label: 'Movies', value: 'MOVIE', icon: 'movie' },
  { label: 'Series', value: 'SERIES', icon: 'tv' },
  { label: 'Anime', value: 'ANIME', icon: 'auto_awesome' },
  { label: 'Manga', value: 'MANGA', icon: 'menu_book' },
  { label: 'Books', value: 'BOOK', icon: 'book' },
  { label: 'Games', value: 'GAME', icon: 'sports_esports' },
];

/**
 * Props for the MediaCard component, supporting multiple variants for different views.
 */
export interface MediaCardProps {
  variant?: 'library' | 'dashboard' | 'discover';
  title: string;
  subtitle?: string; 
  image: string | null; 
  
  status?: MediaStatus;
  percent?: number;
  
  score?: number | null;
  mediaType?: MediaType;
  
  onAddClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}