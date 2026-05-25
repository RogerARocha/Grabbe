import React from 'react';
import type { MediaStatus, MediaType } from './types';
import { formatStatusLabel } from '../../lib/statusUtils';

export type ThemeColor = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'neutral';

export interface MediaCardProps {
  variant?: 'library' | 'dashboard' | 'discover';
  title: string;
  subtitle?: string; 
  image: string | null;
  
  status?: MediaStatus;
  percent?: number;
  currentProgress?: number;
  totalProgress?: number;
  
  typeBadge?: MediaType; 
  
  onAddClick?: (e: React.MouseEvent) => void;
  onProgressClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const THEME_STYLES: Record<ThemeColor, string> = {
  primary: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary/15 text-secondary border-secondary/30',
  tertiary: 'bg-tertiary/15 text-tertiary border-tertiary/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  neutral: 'bg-background/70 text-text-muted border-outline-variant/20',
};

const getStatusColor = (status: MediaStatus): ThemeColor => {
  switch (status) {
    case 'CONSUMING': return 'primary';
    case 'COMPLETED': return 'secondary';
    case 'DROPPED': return 'tertiary';
    case 'PLANNED': return 'warning';
    case 'ON HOLD': return 'warning';
    default: return 'neutral';
  }
};

const getTypeColor = (type: MediaType): ThemeColor => {
  switch (type) {
    case 'MOVIE':
    case 'SERIES': return 'primary';
    case 'ANIME':
    case 'MANGA': return 'warning';
    case 'BOOK':
    case 'GAME': return 'secondary';
    default: return 'neutral';
  }
};

const ImageFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-surface-container">
    <span className="material-symbols-outlined text-4xl text-text-muted">image_not_supported</span>
  </div>
);

/**
 * A highly versatile card component for displaying media items across the application.
 * Adapts its internal layout and hover effects based on the `variant` prop.
 */
export const MediaCard = ({ 
  variant = 'library', 
  title, 
  subtitle, 
  image, 
  status = 'PENDING', 
  percent,
  currentProgress,
  totalProgress,
  typeBadge,
  onAddClick,
  onProgressClick,
  onClick
}: MediaCardProps) => {
  
  if (variant === 'dashboard') {
    const effectiveTotal = totalProgress || 0;

    let progressPercentage = percent;
    if (currentProgress !== undefined && effectiveTotal > 0) {
      progressPercentage = Math.min(100, (currentProgress / effectiveTotal) * 100);
    }

    const hasProgressData = currentProgress !== undefined;
    const progressText = hasProgressData 
      ? `${currentProgress} / ${effectiveTotal || '?'}` 
      : null;

    return (
      <div onClick={onClick} className="group relative bg-surface rounded-lg p-2 transition-transform duration-200 hover:scale-[1.05] primary-glow cursor-pointer">
        <div className="relative w-full aspect-[2/3] max-h-[240px] rounded-lg overflow-hidden border-2 border-primary mb-3">
          {image ? <img className="w-full h-full object-cover" alt={title} src={image} /> : <ImageFallback />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute top-2 right-2 px-2 py-1 glass-panel rounded-full text-[10px] font-bold text-secondary uppercase tracking-wider">
            Active
          </div>
        </div>
        <h3 className="font-bold text-sm truncate px-1 text-text-high">{title}</h3>
        
        <div className="px-1 mt-2 flex items-center justify-between gap-3">
          <div className="flex-1 overflow-hidden">
            {progressPercentage !== undefined && (
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-1">
                <div 
                  className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
          
            <div className="flex items-center justify-between text-[10px] font-bold text-text-muted opacity-80 mt-1.5">
              {hasProgressData && <span className="shrink-0 text-text-high">{progressText}</span>}
            </div>
          </div>
          
          {onProgressClick && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onProgressClick(e);
              }}
              className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 border border-primary/20 group-hover:border-primary/50"
              title="Quick +1"
            >
              <span className="material-symbols-outlined text-base font-bold">add</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'discover') {
    const badgeColor = typeBadge ? getTypeColor(typeBadge) : 'neutral';

    return (
      <div onClick={onClick} className="flex flex-col gap-3 group cursor-pointer">
        <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-container bloom-shadow transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.05] border-2 hover:border-outline-variant/60 ${THEME_STYLES[badgeColor].split(' ')[2]}`}>
          {image ? <img className="w-full h-full object-cover" alt={title} src={image} /> : <ImageFallback />}

          {typeBadge && (
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-full backdrop-blur-md border ${THEME_STYLES[badgeColor]}`}>
                {typeBadge}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onAddClick) onAddClick(e);
              }}
              className="w-full py-2 bg-primary/90 text-on-primary text-[11px] font-bold rounded-md text-center active:scale-95 transition-transform"
            >
              Add to Library
            </button>
          </div>
        </div>
        <div className="px-1">
          <h3 className="text-sm font-semibold text-text-high truncate leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-text-muted mt-1 font-medium truncate">{subtitle}</p>}
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(status);

  return (
    <div onClick={onClick} className="flex flex-col gap-3 group cursor-pointer">
      <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-container bloom-shadow transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.05] border-2 hover:border-outline-variant/60 ${THEME_STYLES[statusColor].split(' ')[2]}`}>
        {image ? <img className="w-full h-full object-cover" alt={title} src={image} /> : <ImageFallback />}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-full backdrop-blur-md border ${THEME_STYLES[statusColor]}`}>
            {formatStatusLabel(status, typeBadge).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="px-1">
        <h3 className="text-sm font-semibold text-text-high truncate leading-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-text-muted mt-1 font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  );
};