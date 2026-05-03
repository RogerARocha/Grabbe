import { MainLayout } from '../components/layout/MainLayout';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryGrid } from '../components/library/LibraryGrid';
import { useState, useEffect } from 'react';
import { getMediaCount } from '../lib/db';
import type { MediaStatus, MediaType } from '../components/shared/types';

export const Library = () => {

  const [activeTab, setActiveTab] = useState<MediaType>('ALL');
  const [activeStatus, setActiveStatus] = useState<MediaStatus | 'ALL'>('ALL');
  const [count, setCount] = useState(0);

  useEffect(() => {
    getMediaCount().then(setCount).catch(console.error);
  }, []);

  return (
    <MainLayout>
      <LibraryHeader count={count} />
      
      <LibraryFilters activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeStatus={activeStatus} 
        setActiveStatus={setActiveStatus} 
      />

      <LibraryGrid 
        activeTab={activeTab}
        activeStatus={activeStatus}
      />
    </MainLayout>
  );
};
