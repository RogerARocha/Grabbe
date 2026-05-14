import { useNavigate } from 'react-router-dom';

/**
 * Displays aggregate statistics for the user's library.
 */
export const QuickStats = ({ items = [] }: { items?: any[] }) => {
  const navigate = useNavigate();
  const totalMedia = items.length;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newThisWeek = items.filter(i => i.created_at && new Date(i.created_at) >= oneWeekAgo).length;

  const masterpieces = items.filter(i => i.score === 10).length;

  // TODO: We don't have accurate hours watched yet without tracking runtime per item precisely,
  // so we'll just show completed count for now or mock the hours based on completed items.
  const completedCount = items.filter(i => i.status === 'COMPLETED').length;
  const estimatedHours = completedCount * 2; // rough mock

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div 
        onClick={() => navigate('/library')}
        className="bg-surface p-6 rounded-xl border-l-4 border-primary bloom-shadow cursor-pointer hover:bg-surface-container transition-colors group"
      >
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Total Media</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{totalMedia}</span>
          <span className="text-[12px] text-secondary font-bold">+{newThisWeek} added this week</span>
        </div>
      </div>
      <div 
        onClick={() => navigate('/analytics')}
        className="bg-surface p-6 rounded-xl border-l-4 border-tertiary bloom-shadow cursor-pointer hover:bg-surface-container transition-colors group"
      >
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 group-hover:text-tertiary transition-colors">Estimated Hours</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{estimatedHours}</span>
          <span className="text-[12px] text-tertiary font-bold">{completedCount} items completed</span>
        </div>
      </div>
      <div 
        onClick={() => navigate('/ranking')}
        className="bg-surface p-6 rounded-xl border-l-4 border-secondary bloom-shadow cursor-pointer hover:bg-surface-container transition-colors group"
      >
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 group-hover:text-secondary transition-colors">Your Masterpieces</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{masterpieces}</span>
          <span className="material-symbols-outlined text-warning text-2xl group-hover:scale-110 transition-transform">trophy</span>
        </div>
      </div>
    </section>
  );
};
