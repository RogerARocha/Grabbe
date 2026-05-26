export const GeneralStatus = ({ items = [] }: { items: any[] }) => {
  const totalMedia = items.length;
  const totalWithStatus = items.length || 1;
  const countCompleted = items.filter(i => i.status === 'COMPLETED').length;
  const countWatching = items.filter(i => i.status === 'CONSUMING').length;
  const countPlanned = items.filter(i => i.status === 'PLANNED').length;
  const countOnHold = items.filter(i => i.status === 'ON HOLD').length;
  const countDropped = items.filter(i => i.status === 'DROPPED').length;

  const pctCompleted = Math.round((countCompleted / totalWithStatus) * 100);
  const pctWatching = Math.round((countWatching / totalWithStatus) * 100);
  const pctPlanned = Math.round((countPlanned / totalWithStatus) * 100);
  const pctOnHold = Math.round((countOnHold / totalWithStatus) * 100);
  const pctDropped = Math.round((countDropped / totalWithStatus) * 100);

  // Donut chart logic (conic gradient)
  let currentStop = 0;
  const stops = [];
  
  if (pctCompleted > 0) {
    stops.push(`var(--color-secondary) ${currentStop}% ${currentStop + pctCompleted}%`);
    currentStop += pctCompleted;
  }
  if (pctWatching > 0) {
    stops.push(`var(--color-primary) ${currentStop}% ${currentStop + pctWatching}%`);
    currentStop += pctWatching;
  }
  if (pctPlanned > 0) {
    stops.push(`var(--color-warning) ${currentStop}% ${currentStop + pctPlanned}%`);
    currentStop += pctPlanned;
  }
  if (pctOnHold > 0) {
    stops.push(`#ddff00 ${currentStop}% ${currentStop + pctOnHold}%`);
    currentStop += pctOnHold;
  }
  if (pctDropped > 0) {
    stops.push(`var(--color-error) ${currentStop}% ${currentStop + pctDropped}%`);
    currentStop += pctDropped;
  }
  const conicGradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'none';

  return (
    <section className="bg-surface rounded-xl p-6 flex flex-col w-full bloom-shadow border border-surface-container-high">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-text-high flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">donut_large</span>
          General Status
        </h3>
        <p className="text-sm text-text-muted mt-1">Distribution of items by status</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-10 justify-center h-full pb-4">
        {/* Donut Chart */}
        <div 
          className="relative w-40 h-40 rounded-full" 
          style={{ background: conicGradient }}
        >
          <div className="absolute inset-2 rounded-full flex items-center justify-center flex-col bg-surface">
            <span className="text-3xl font-black text-text-high">{totalMedia}</span>
            <span className="text-xs font-bold text-text-muted">Total</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span className="text-sm text-text-muted w-24">Completed</span>
            <span className="text-sm text-text-high font-bold">{pctCompleted}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm text-text-muted w-24">Watching</span>
            <span className="text-sm text-text-high font-bold">{pctWatching}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-sm text-text-muted w-24">Planned</span>
            <span className="text-sm text-text-high font-bold">{pctPlanned}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ddff00]"></div>
            <span className="text-sm text-text-muted w-24">On Hold</span>
            <span className="text-sm text-text-high font-bold">{pctOnHold}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span className="text-sm text-text-muted w-24">Dropped</span>
            <span className="text-sm text-text-high font-bold">{pctDropped}%</span>
          </div>
        </div>
      </div>
    </section>
  );
};
