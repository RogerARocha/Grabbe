import { calculateAdjustedPercentages } from '../../lib/timeMetrics';

export const CriticalTaste = ({ items = [] }: { items: any[] }) => {
  const scoredItems = items.filter(i => i.score && i.score > 0);
  const countMasterpiece = scoredItems.filter(i => i.score === 10).length;
  const countGreat = scoredItems.filter(i => i.score === 9).length;
  const countGood = scoredItems.filter(i => i.score === 7 || i.score === 8).length;
  const countAverage = scoredItems.filter(i => i.score === 5 || i.score === 6).length;
  const countBad = scoredItems.filter(i => i.score >= 1 && i.score <= 4).length;

  const [
    pctMasterpiece,
    pctGreat,
    pctGood,
    pctAverage,
    pctBad
  ] = calculateAdjustedPercentages([
    countMasterpiece,
    countGreat,
    countGood,
    countAverage,
    countBad
  ]);

  return (
    <section className="bg-surface rounded-xl p-6 flex flex-col w-full bloom-shadow border border-surface-container-high">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-text-high flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">star</span>
          Critical Taste
        </h3>
        <p className="text-sm text-text-muted mt-1">Distribution of given scores</p>
      </div>
      
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="prismatic-text-blue font-bold">Masterpiece (10)</span>
            <span className="text-text-muted">{pctMasterpiece}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full prismatic-bg-blue-horizontal rounded-full" style={{ width: `${pctMasterpiece}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-primary font-bold">Great (9)</span>
            <span className="text-text-muted">{pctGreat}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pctGreat}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-secondary font-bold">Good (7-8)</span>
            <span className="text-text-muted">{pctGood}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${pctGood}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-warning font-bold">Average (5-6)</span>
            <span className="text-text-muted">{pctAverage}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-warning rounded-full" style={{ width: `${pctAverage}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-error font-bold">Bad (1-4)</span>
            <span className="text-text-muted">{pctBad}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-error rounded-full" style={{ width: `${pctBad}%` }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};
