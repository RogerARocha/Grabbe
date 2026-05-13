import { MediaType, TYPE_FILTERS } from './types';

interface TypeFiltersProps {
  activeTab: MediaType;
  setActiveTab: (tab: MediaType) => void;
}

export const TypeFilters = ({ activeTab, setActiveTab }: TypeFiltersProps) => {
  return (
    <div className="flex items-center gap-2 border-b border-outline-variant/10">
      {TYPE_FILTERS.map((filter) => {
        const isActive = activeTab === filter.value;
        
        return (
          <button
            key={filter.value}
            onClick={() => setActiveTab(filter.value)}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              isActive 
                ? 'bg-surface border-b-2 border-primary text-text-high' 
                : 'text-text-muted hover:text-text-high hover:bg-surface-container border-b-2 border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {filter.icon}
            </span>
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};
