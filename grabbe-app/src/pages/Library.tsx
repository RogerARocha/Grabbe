import { MainLayout } from '../components/layout/MainLayout';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryGrid } from '../components/library/LibraryGrid';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMediaCount } from '../lib/db';
import { useLibraryStore } from '../store/libraryStore';

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

  useEffect(() => {
    getMediaCount().then(setCount).catch(console.error);
  }, []);

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
        activeTab={activeTab}
        activeStatus={activeStatus}
        searchQuery={searchQuery}
        sortBy={sortBy}
      />
    </MainLayout>
  );
};
