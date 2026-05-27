import { MainLayout } from '../components/layout/MainLayout';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryGrid } from '../components/library/LibraryGrid';
import { useState, useEffect } from 'react';
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

  const [count, setCount] = useState(0);

  useEffect(() => {
    getMediaCount().then(setCount).catch(console.error);
  }, []);

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
