import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
import { QuickStats } from '../components/dashboard/QuickStats';
import { CurrentlyConsuming } from '../components/dashboard/CurrentlyConsuming';
import { RecentEvaluations } from '../components/dashboard/RecentEvaluations';
import { RightSidebar } from '../components/dashboard/RightSidebar';
import { getLibraryItems, getUnlinkedMediaItems } from '../lib/db';
import { UnlinkedMediaBanner } from '../components/shared/UnlinkedMediaBanner';
import { UnlinkedMediaAssistantModal } from '../components/modals/UnlinkedMediaAssistantModal';

export const Dashboard = () => {
  const [items, setItems] = useState<any[]>([]);
  const [unlinkedCount, setUnlinkedCount] = useState(0);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const all = await getLibraryItems();
      if (all) {
        setItems(all);
      }
      const unlinked = await getUnlinkedMediaItems();
      setUnlinkedCount(unlinked.length);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <MainLayout>
      <WelcomeHeader items={items} />

      {!isBannerDismissed && unlinkedCount > 0 && (
        <UnlinkedMediaBanner
          className="mb-8"
          unlinkedCount={unlinkedCount}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onDismiss={() => setIsBannerDismissed(true)}
        />
      )}

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

      <UnlinkedMediaAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => {
          setIsAssistantOpen(false);
          loadData();
        }}
        onItemResolved={() => {
          loadData();
        }}
      />
    </MainLayout>
  );
};
