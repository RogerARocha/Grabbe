import { MainLayout } from '../components/layout/MainLayout';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
import { QuickStats } from '../components/dashboard/QuickStats';
import { CurrentlyConsuming } from '../components/dashboard/CurrentlyConsuming';
import { RecentEvaluations } from '../components/dashboard/RecentEvaluations';
import { RightSidebar } from '../components/dashboard/RightSidebar';

export const Dashboard = () => {
  return (
    <MainLayout>
      <WelcomeHeader />
      <QuickStats />
      
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Content */}
        <div className="col-span-12 lg:col-span-9 space-y-12">
          <CurrentlyConsuming />
          <RecentEvaluations />
        </div>

        {/* Right Column: Planned Next & Trending */}
        <RightSidebar />
      </div>
    </MainLayout>
  );
};
