import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useImportProgress } from '../../contexts/ImportContext';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isImporting, progress } = useImportProgress();

  return (
    <div className="overflow-hidden bg-background text-text-base font-sans">
      <Sidebar />
      <TopBar />
      <main id="main-content" className="ml-65 mt-10.5 h-[calc(100vh-42px)] px-12 pb-12 pt-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {children}
      </main>

      {isImporting && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface border border-outline-variant/30 bloom-shadow rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="relative flex items-center justify-center w-10 h-10">
            <span className="material-symbols-outlined absolute text-primary text-2xl animate-spin">progress_activity</span>
          </div>
          <div className="flex flex-col pr-4">
            <span className="text-sm font-bold text-text-high">Importing Library...</span>
            <span className="text-xs text-text-muted">
              Processing {progress.current} of {progress.total} items
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
