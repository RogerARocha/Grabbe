import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-text-base font-sans">
      <Sidebar />
      <TopBar />
      <main className="ml-[260px] pt-24 px-12 pb-12 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
