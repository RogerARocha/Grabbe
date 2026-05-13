import { MediaType, MediaStatus } from '../shared/types';
import { TypeFilters } from '../shared/TypeFilters';

interface LibraryFiltersProps {
  activeTab: MediaType;
  setActiveTab: (tab: MediaType) => void;
  activeStatus: MediaStatus | 'ALL';
  setActiveStatus: (status: MediaStatus | 'ALL') => void;
}

const STATUS_FILTERS: (MediaStatus | 'ALL')[] = ['ALL', 'CONSUMING', 'PLANNED', 'ON HOLD', 'COMPLETED', 'DROPPED'];

/**
 * Renders the top-level type and status filter controls for the library view.
 */
export const LibraryFilters = ({ 
  activeTab, 
  setActiveTab, 
  activeStatus, 
  setActiveStatus 
}: LibraryFiltersProps) => {
  
  return (
    <div className="space-y-6 mb-12">
      <TypeFilters activeTab={activeTab} setActiveTab={setActiveTab} />

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