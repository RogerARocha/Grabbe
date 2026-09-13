import { MainLayout } from '../components/layout/MainLayout';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryGrid } from '../components/library/LibraryGrid';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMediaCount, getUnlinkedMediaItems } from '../lib/db';
import { useLibraryStore } from '../store/libraryStore';
import { UnlinkedMediaBanner } from '../components/shared/UnlinkedMediaBanner';
import { UnlinkedMediaAssistantModal } from '../components/modals/UnlinkedMediaAssistantModal';

export const Library = () => {
  const {
    activeTab,
    activeStatus,
    searchQuery,
    sortBy,
    setActiveTab,
    setActiveStatus,
    setSearchQuery,
    setSortBy
  } = useLibraryStore();

  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const [count, setCount] = useState(0);
  const [unlinkedCount, setUnlinkedCount] = useState(0);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadLibraryData = useCallback(async () => {
    try {
      const c = await getMediaCount();
      setCount(c);
      const unlinked = await getUnlinkedMediaItems();
      setUnlinkedCount(unlinked.length);
    } catch (err) {
      console.error('Failed to load library metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadLibraryData();
  }, [loadLibraryData]);

  useEffect(() => {
    if (statusParam) {
      const upperStatus = statusParam.toUpperCase();
      const validStatuses = ['ALL', 'CONSUMING', 'PLANNED', 'ON HOLD', 'COMPLETED', 'DROPPED'];
      if (validStatuses.includes(upperStatus)) {
        setActiveStatus(upperStatus as any);
      }
    }
  }, [statusParam, setActiveStatus]);

  return (
    <MainLayout>
      <LibraryHeader count={count} />

      {!isBannerDismissed && unlinkedCount > 0 && (
        <UnlinkedMediaBanner
          className="mb-8"
          unlinkedCount={unlinkedCount}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onDismiss={() => setIsBannerDismissed(true)}
        />
      )}
      
      <LibraryFilters 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeStatus={activeStatus} 
        setActiveStatus={setActiveStatus} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <LibraryGrid 
        key={refreshKey}
        activeTab={activeTab}
        activeStatus={activeStatus}
        searchQuery={searchQuery}
        sortBy={sortBy}
      />

      <UnlinkedMediaAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => {
          setIsAssistantOpen(false);
          loadLibraryData();
          setRefreshKey(k => k + 1);
        }}
        onItemResolved={() => {
          loadLibraryData();
        }}
      />
    </MainLayout>
  );
};
