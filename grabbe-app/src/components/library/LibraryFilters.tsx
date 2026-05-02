import { MediaType, MediaStatus, TYPE_FILTERS } from '../shared/types'; // Ajuste seus imports

interface LibraryFiltersProps {
  activeTab: MediaType;
  setActiveTab: (tab: MediaType) => void;
  activeStatus: MediaStatus | 'ALL';
  setActiveStatus: (status: MediaStatus | 'ALL') => void;
}

const STATUS_FILTERS: (MediaStatus | 'ALL')[] = ['ALL', 'CONSUMING', 'PLANNED', 'COMPLETED', 'DROPPED'];

export const LibraryFilters = ({ 
  activeTab, 
  setActiveTab, 
  activeStatus, 
  setActiveStatus 
}: LibraryFiltersProps) => {
  
  return (
    <div className="space-y-6 mb-12">
      
      {/* ── Top Level Media Categories ── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/10">
        {TYPE_FILTERS.map((filter) => {
          const isActive = activeTab === filter.value;
          
          return (
            <button 
              key={filter.value} 
              onClick={() => setActiveTab(filter.value)}
              className={`px-6 py-3 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                isActive 
                  ? 'bg-surface border-b-2 border-tertiary text-text-high' 
                  : 'text-text-muted hover:text-text-high hover:bg-surface-container border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{filter.icon}</span>
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* ── Secondary Status Filters ── */}
      <div className="flex items-center gap-3">
        {STATUS_FILTERS.map(status => {
          const isActive = activeStatus === status;
          
          return (
            <button 
              key={status} 
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                isActive 
                  ? 'bg-surface-container-highest text-text-high border border-outline-variant/30 shadow-sm' 
                  : 'bg-surface-container text-text-muted border border-transparent hover:bg-surface-container-highest hover:text-text-high'
              }`}
            >
              {status === 'ALL' ? 'ALL STATUS' : status}
            </button>
          );
        })}
      </div>
      
    </div>
  );
};