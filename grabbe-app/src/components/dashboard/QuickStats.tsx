export const QuickStats = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-surface p-6 rounded-xl border-l-4 border-primary bloom-shadow">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Total Media</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">1,284</span>
          <span className="text-[12px] text-secondary font-bold">+12 this week</span>
        </div>
      </div>
      <div className="bg-surface p-6 rounded-xl border-l-4 border-tertiary bloom-shadow">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Hours Watched</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">8,432</span>
          <span className="text-[12px] text-tertiary font-bold">Top 1% critic</span>
        </div>
      </div>
      <div className="bg-surface p-6 rounded-xl border-l-4 border-secondary bloom-shadow">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Your Masterpieces</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">260</span>
          <span className="material-symbols-outlined text-warning text-2xl">trophy</span>
        </div>
      </div>
    </section>
  );
};
