import { RankingRow } from './RankingRow';

interface RankingListProps {
  items: any[];
  isLoading: boolean;
  onOpenModal: (item: any) => void;
}

export const RankingList = ({ items, isLoading, onOpenModal }: RankingListProps) => {
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
      {items.map((item, index) => (
        <RankingRow key={item.id || index} item={item} onOpenModal={onOpenModal} />
      ))}
    </div>
  );
};
