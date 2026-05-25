import { useMemo } from 'react';
import { RankingRow } from './RankingRow';
import { useRankingStore } from '../../store/rankingStore';

interface RankingListProps {
  items: any[];
  isLoading: boolean;
  onOpenModal: (item: any) => void;
}

export const RankingList = ({ items, isLoading, onOpenModal }: RankingListProps) => {
  const { nameSort, scoreSort, setNameSort, setScoreSort } = useRankingStore();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
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
  }, [items, nameSort, scoreSort]);

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

      {sortedItems.map((item, index) => (
        <RankingRow key={item.id || index} item={item} onOpenModal={onOpenModal} />
      ))}
    </div>
  );
};
