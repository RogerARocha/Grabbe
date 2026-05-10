import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="overflow-hidden bg-background text-text-base font-sans">
      <Sidebar />
      <TopBar />
      <main className="ml-[260px] mt-[42px] h-[calc(100vh-42px)] px-12 pb-12 pt-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {children}
      </main>
    </div>
  );
};
