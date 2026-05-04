export const QuickStats = ({ items = [] }: { items?: any[] }) => {
  const totalMedia = items.length;
  // Approximation of "New this week" by checking updated_at in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = items.filter(i => new Date(i.updated_at) >= oneWeekAgo).length;

  const masterpieces = items.filter(i => i.score === 10).length;

  // We don't have accurate hours watched yet without tracking runtime per item precisely,
  // so we'll just show completed count for now or mock the hours based on completed items.
  const completedCount = items.filter(i => i.status === 'COMPLETED').length;
  const estimatedHours = completedCount * 2; // rough mock

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-surface p-6 rounded-xl border-l-4 border-primary bloom-shadow">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Total Media</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{totalMedia}</span>
          <span className="text-[12px] text-secondary font-bold">+{newThisWeek} this week</span>
        </div>
      </div>
      <div className="bg-surface p-6 rounded-xl border-l-4 border-tertiary bloom-shadow">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Estimated Hours</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{estimatedHours}</span>
          <span className="text-[12px] text-tertiary font-bold">{completedCount} items completed</span>
        </div>
      </div>
      <div className="bg-surface p-6 rounded-xl border-l-4 border-secondary bloom-shadow">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Your Masterpieces</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{masterpieces}</span>
          <span className="material-symbols-outlined text-warning text-2xl">trophy</span>
        </div>
      </div>
    </section>
  );
};
