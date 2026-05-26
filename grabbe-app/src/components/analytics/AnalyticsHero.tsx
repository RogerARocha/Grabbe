import { calculateInvestedMinutes, formatTotalHours } from '../../lib/timeMetrics';

export const AnalyticsHero = ({ items = [] }: { items: any[] }) => {
  const totalMedia = items.length;

  const totalMinutes = items.reduce((acc, item) => {
    return acc + calculateInvestedMinutes(item.type, item.consumption_metric, item.progress || 0);
  }, 0);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const thisMonthMinutes = items
    .filter(i => {
      if (!i.finish_date) return false;
      const parsedDate = new Date(i.finish_date.includes(' ') ? i.finish_date.replace(' ', 'T') + 'Z' : i.finish_date);
      return parsedDate >= oneMonthAgo;
    })
    .reduce((acc, item) => {
      return acc + calculateInvestedMinutes(item.type, item.consumption_metric, item.progress || 0);
    }, 0);

  return (
    <section className="bg-surface rounded-xl p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between group bloom-shadow border border-surface-container-high">
      <div className="absolute inset-0 bg-linear-to-br from-secondary/5 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
        <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Total Lifetime</p>
        <h2 className="text-5xl md:text-6xl font-black prismatic-text mb-2">
          {formatTotalHours(totalMinutes)}
        </h2>
        <p className="text-lg text-text-muted flex items-center gap-2">
          {totalMedia} items
        </p>
      </div>
      
      <div className="relative z-10 mt-6 md:mt-0 p-5 rounded-lg bg-surface-container/50 border border-outline-variant/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30">
            <span className="material-symbols-outlined text-secondary">trending_up</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-muted">This Month</p>
            <p className="text-xl font-bold text-text-high">+{formatTotalHours(thisMonthMinutes)}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
