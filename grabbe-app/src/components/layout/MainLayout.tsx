import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#002b36] text-[#eee8d5] font-sans">
      <Sidebar />
      <TopBar />
      <main className="ml-[260px] p-10 min-h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
};
