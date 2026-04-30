import { MainLayout } from '../components/layout/MainLayout';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryGrid } from '../components/library/LibraryGrid';

export const Library = () => {
  return (
    <MainLayout>
      <LibraryHeader />
      <LibraryFilters />
      <LibraryGrid />
    </MainLayout>
  );
};
