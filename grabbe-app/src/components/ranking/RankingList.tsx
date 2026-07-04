import { useMemo, useState } from 'react';
import { RankingRow } from './RankingRow';
import { useRankingStore } from '../../store/rankingStore';
import { GenreFilterModal } from '../modals/GenreFilterModal';

interface RankingListProps {
  items: any[];
  isLoading: boolean;
  onOpenModal: (item: any) => void;
}

export const RankingList = ({ items, isLoading, onOpenModal }: RankingListProps) => {
  const { nameSort, scoreSort, setNameSort, setScoreSort, selectedGenres, setSelectedGenres } = useRankingStore();
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  const uniqueGenres = useMemo(() => {
    const genresSet = new Set<string>();
    items.forEach(item => {
      if (item.genres) {
        try {
          const parsed = typeof item.genres === 'string' ? JSON.parse(item.genres) : item.genres;
          if (Array.isArray(parsed)) {
            parsed.forEach(g => {
              if (typeof g === 'string' && g.trim()) {
                genresSet.add(g.trim());
              }
            });
          }
        } catch (e) {
          if (typeof item.genres === 'string') {
            item.genres.split(',').forEach((g: string) => {
              if (g.trim()) genresSet.add(g.trim());
            });
          }
        }
      }
    });
    return Array.from(genresSet).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedGenres.length === 0) return items;
    return items.filter(item => {
      if (!item.genres) return false;
      const itemGenresList: string[] = (() => {
        try {
          const parsed = typeof item.genres === 'string' ? JSON.parse(item.genres) : item.genres;
          return Array.isArray(parsed) ? parsed.map((g: string) => g.trim().toLowerCase()) : [];
        } catch (e) {
          if (typeof item.genres === 'string') {
            return item.genres.split(',').map((g: string) => g.trim().toLowerCase()).filter(Boolean);
          }
          return [];
        }
      })();
      
      return selectedGenres.some(sg => itemGenresList.includes(sg.toLowerCase()));
    });
  }, [items, selectedGenres]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      // Primary sort: Score
      if (a.score !== b.score) {
        return scoreSort === 'desc' ? b.score - a.score : a.score - b.score;
      }
      // Secondary sort: Name
      const nameA = (a.title || '').toLowerCase();
      const nameB = (b.title || '').toLowerCase();
      if (nameA < nameB) return nameSort === 'asc' ? -1 : 1;
      if (nameA > nameB) return nameSort === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, nameSort, scoreSort]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface rounded-lg h-24 flex items-stretch overflow-hidden animate-pulse">
            <div className="w-2 shrink-0 bg-surface-container-high" />
            <div className="flex flex-1 items-center px-4 gap-6">
              <div className="h-16 w-12 bg-surface-container rounded" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-surface-container rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4 opacity-50">
          format_list_numbered
        </span>
        <h3 className="text-xl font-bold text-text-high mb-2">No ranked media yet</h3>
        <p className="text-text-muted max-w-sm">
          You haven't assigned a score to any media of this type. Evaluate items in your library to see them ranked here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header Row for Sorting */}
      <div className="flex items-stretch h-8 mb-2 text-xs font-bold uppercase tracking-widest text-text-muted px-2">
        <div className="w-2 shrink-0" />
        <div className="flex flex-1 items-center px-4 gap-6">
          <div className="w-12 shrink-0" />
          
          <div 
            className="flex-1 flex items-center gap-2 cursor-pointer hover:text-text-base transition-colors select-none"
            onClick={() => setNameSort(nameSort === 'asc' ? 'desc' : 'asc')}
          >
            Name
            <span className="bg-surface-container-high text-text-base px-2 py-0.5 rounded text-[10px]">
              {nameSort === 'asc' ? 'A-Z' : 'Z-A'}
            </span>
          </div>

          <div 
            className="w-48 shrink-0 flex items-center gap-2 cursor-pointer hover:text-text-base transition-colors select-none group"
            onClick={() => setIsGenreModalOpen(true)}
          >
            Genre
            <span className={`material-symbols-outlined text-[16px] transition-all group-hover:scale-110 ${selectedGenres.length > 0 ? 'text-primary' : 'text-text-muted/60 group-hover:text-text-muted'}`}>
              filter_alt
            </span>
            {selectedGenres.length > 0 && (
              <span className="bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                {selectedGenres.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-12 shrink-0 px-4">
            <div 
              className="flex items-center justify-center gap-2 w-16 cursor-pointer hover:text-text-base transition-colors select-none"
              onClick={() => setScoreSort(scoreSort === 'desc' ? 'asc' : 'desc')}
            >
              Score
              <span className="bg-surface-container-high text-text-base px-2 py-0.5 rounded text-[10px]">
                {scoreSort === 'desc' ? 'DESC' : 'ASC'}
              </span>
            </div>
            <div className="flex items-center justify-center w-20">Type</div>
            <div className="flex items-center justify-center w-24">Progress</div>
          </div>
        </div>
      </div>

      {sortedItems.length > 0 ? (
        sortedItems.map((item, index) => (
          <RankingRow key={item.id || index} item={item} onOpenModal={onOpenModal} />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface/30 rounded-2xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl text-text-muted mb-2 opacity-50">
            filter_list_off
          </span>
          <p className="text-text-muted text-sm font-semibold">No media matches the selected genre filters.</p>
          <button
            onClick={() => setSelectedGenres([])}
            className="mt-3 text-xs font-bold text-primary hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      <GenreFilterModal
        isOpen={isGenreModalOpen}
        availableGenres={uniqueGenres}
        initialSelectedGenres={selectedGenres}
        onApply={setSelectedGenres}
        onClose={() => setIsGenreModalOpen(false)}
      />
    </div>
  );
};
