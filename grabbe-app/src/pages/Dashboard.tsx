import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
import { QuickStats } from '../components/dashboard/QuickStats';
import { CurrentlyConsuming } from '../components/dashboard/CurrentlyConsuming';
import { RecentEvaluations } from '../components/dashboard/RecentEvaluations';
import { RightSidebar } from '../components/dashboard/RightSidebar';
import { getLibraryItems } from '../lib/db';

export const Dashboard = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getLibraryItems().then((all) => {
      if (all) {
        setItems(all);
      }
    });
  }, []);

  return (
    <MainLayout>
      <WelcomeHeader />
      <QuickStats items={items} />
      
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Content */}
        <div className="col-span-12 lg:col-span-9 space-y-12">
          <CurrentlyConsuming items={items} />
          <RecentEvaluations items={items} />
        </div>

        {/* Right Column: Planned Next & Trending */}
        <RightSidebar items={items} />
      </div>
    </MainLayout>
  );
};
