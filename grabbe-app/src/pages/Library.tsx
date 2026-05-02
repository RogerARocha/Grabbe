import { MainLayout } from '../components/layout/MainLayout';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryGrid } from '../components/library/LibraryGrid';
import { useState } from 'react';
import type { MediaStatus, MediaType } from '../components/shared/types';

export const Library = () => {

  const [activeTab, setActiveTab] = useState<MediaType>('ALL');
  const [activeStatus, setActiveStatus] = useState<MediaStatus | 'ALL'>('ALL');

  return (
    <MainLayout>
      <LibraryHeader />
      
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
