import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLibraryItems } from '../../lib/db';
import { MediaCard, MediaStatus } from '../shared/MediaCard';
import type { MediaType } from '../shared/types';


interface LibraryGridProps {
  activeTab: MediaType;
  activeStatus: MediaStatus | 'ALL';
}



export const LibraryGrid = ({ activeTab, activeStatus }: LibraryGridProps) => {
  const [displayCount, setDisplayCount] = useState(12);
  const [data, setData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getLibraryItems().then(items => {
      setData(items || []);
    });
  }, [activeTab, activeStatus]);

  // 1. Filtragem Cruzada (O coração do componente)
  const filteredData = data.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.type === activeTab;
    const matchesStatus = activeStatus === 'ALL' || item.status === activeStatus;
    return matchesTab && matchesStatus;
  });

  // 2. Paginação
  const displayedItems = filteredData.slice(0, displayCount);
  const hasMore = displayCount < filteredData.length;

  // 3. Renderização Condicional (Caso o filtro não retorne nada)
  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6 border border-outline-variant/20">
          <span className="material-symbols-outlined text-3xl text-text-muted">folder_off</span>
        </div>
        <h3 className="text-lg font-bold text-text-high mb-2">No entries found</h3>
        <p className="text-sm text-text-muted">
          Try changing your filters or add new media from the Discover page.
        </p>
      </div>
    );
  }

  // 4. Renderização do Grid
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {displayedItems.map(item => {
          const typeCapitalized = item.type.charAt(0) + item.type.slice(1).toLowerCase();
          const releaseYear = item.release_date ? String(item.release_date).substring(0, 4) : null;
          const extraInfo = releaseYear || `${item.progress} / ${item.total_progress || '?'}`;
          const finalSubtitle = `${typeCapitalized} • ${extraInfo}`;

          return (
            <MediaCard 
              key={item.id} 
              variant="library" 
              title={item.title}
              subtitle={finalSubtitle}
              image={item.cover_image_path}
              status={item.status}
              typeBadge={item.type}
              onClick={() => navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`)}
            />
          );
        })}
      </div>
      
      {/* Pagination / Load More */}
      {hasMore && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => setDisplayCount(prev => prev + 12)}
            className="flex items-center gap-2 px-8 py-4 bg-surface-container-high rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all duration-300 group text-text-high"
          >
            Load More Entries
            <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">expand_more</span>
          </button>
        </div>
      )}
    </>
  );
};
