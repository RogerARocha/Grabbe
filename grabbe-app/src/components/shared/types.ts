export type MediaStatus = 'CONSUMING' | 'COMPLETED' | 'DROPPED' | 'PLANNED' | 'PENDING';

export type MediaType = 'ALL' | 'MOVIE' | 'SERIES' | 'ANIME' | 'MANGA' | 'BOOK' | 'GAME';

export const TYPE_FILTERS: { label: string; value: MediaType; icon: string }[] = [
  { label: 'All', value: 'ALL', icon: 'grid_view' },
  { label: 'Movies', value: 'MOVIE', icon: 'movie' },
  { label: 'Series', value: 'SERIES', icon: 'tv' },
  { label: 'Anime', value: 'ANIME', icon: 'auto_awesome' },
  { label: 'Manga', value: 'MANGA', icon: 'menu_book' },
  { label: 'Books', value: 'BOOK', icon: 'book' },
  { label: 'Games', value: 'GAME', icon: 'sports_esports' },
];

export interface MediaCardProps {
  variant?: 'library' | 'dashboard' | 'discover';
  title: string;
  subtitle?: string; 
  image: string | null; 
  
  // Específico para Dashboard/Library
  status?: MediaStatus;
  percent?: number;
  
  // Específico para Discover
  score?: number | null;
  mediaType?: MediaType; // Substitui typeBadge e typeColor
  
  // Ações
  onAddClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}