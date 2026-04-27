import { MainLayout } from '../components/layout/MainLayout';

export const Dashboard = () => {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter prismatic-text pb-2">
          Welcome Back, Pedro.
        </h1>
        <p className="text-[#93a1a1] text-base font-medium mt-1">
          Here is your entertainment radar for today.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat Card 1 */}
        <div className="bg-[#073642] p-6 rounded-xl bloom-shadow border-l-4 border-[#00A3F5] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#93a1a1] mb-2">TOTAL MEDIA</p>
              <h2 className="text-3xl font-bold text-white">230</h2>
            </div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-[#073642] p-6 rounded-xl bloom-shadow border-l-4 border-[#D33682] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#93a1a1] mb-2">Currently Watching/Playing</p>
              <h2 className="text-3xl font-bold text-white">148</h2>
            </div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-[#073642] p-6 rounded-xl bloom-shadow border-l-4 border-[#53EAAA] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#93a1a1] mb-2">Total Hours</p>
              <h2 className="text-3xl font-bold text-white">45</h2>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
