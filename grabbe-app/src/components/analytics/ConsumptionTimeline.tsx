import { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { isYearOnly, parseDate } from '../../lib/dateUtils';

interface MediaSession {
  start_date: string;
  finish_date: string;
  total_hours: number;
  media_id: string;
  title: string;
  type: string;
}

const DISTINCT_COLORS = [
  'hsl(210, 85%, 60%)', // Blue
  'hsl(140, 75%, 55%)', // Green
  'hsl(330, 85%, 60%)', // Pink
  'hsl(270, 80%, 65%)', // Purple
  'hsl(35, 95%, 55%)',  // Amber/Gold
  'hsl(180, 75%, 50%)', // Cyan
  'hsl(15, 90%, 55%)',  // Red-Orange
  'hsl(85, 75%, 50%)',  // Lime
  'hsl(240, 80%, 65%)', // Indigo
  'hsl(300, 75%, 60%)', // Magenta
  'hsl(160, 80%, 45%)', // Teal
  'hsl(45, 95%, 50%)',  // Yellow
];

const getColor = (index: number) => {
  const colorIndex = index % DISTINCT_COLORS.length;
  return DISTINCT_COLORS[colorIndex];
};

const CustomTooltip = ({ active, payload, label, hoveredBarId }: any) => {
  if (active && payload && payload.length) {
    let entriesToShow = [...payload]
      .filter(entry => Number(entry.value) > 0.01);

    if (hoveredBarId) {
      entriesToShow = entriesToShow.filter(entry => entry.dataKey === hoveredBarId);
    }

    entriesToShow.sort((a, b) => Number(b.value) - Number(a.value));

    if (entriesToShow.length === 0) return null;

    const displayedTotal = entriesToShow.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

    return (
      <div className="bg-surface-container/95 border border-outline-variant/20 p-4 rounded-xl bloom-shadow backdrop-blur-md text-sm text-text-high max-w-sm select-none">
        <p className="font-bold text-text-muted uppercase tracking-wider text-[10px] mb-2">{label}</p>
        <div className="flex justify-between items-baseline mb-3 pb-2 border-b border-outline-variant/10">
          <span className="font-semibold">{hoveredBarId ? "Selected Media" : "Total Time"}</span>
          <span className="text-lg font-black text-secondary">{displayedTotal.toFixed(1)}h</span>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {entriesToShow.map((entry: any) => (
            <div key={entry.dataKey} className="flex justify-between items-center gap-4 text-[13px]">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                <span className="font-medium truncate text-text-high/90">{entry.name}</span>
              </div>
              <span className="font-semibold shrink-0 tabular-nums">{Number(entry.value).toFixed(1)}h</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ConsumptionTimeline = ({ sessions = [] }: { sessions: MediaSession[] }) => {
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);

  // Normalize sessions so that if start_date is missing, it defaults to finish_date
  const normalizedSessions = useMemo(() => {
    return sessions.map(s => ({
      ...s,
      start_date: s.start_date || s.finish_date
    })).filter(s => s.start_date && s.finish_date);
  }, [sessions]);

  // Extract all unique years available from full dates in sessions
  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    normalizedSessions.forEach(s => {
      if (s.start_date && !isYearOnly(s.start_date)) {
        const y = parseDate(s.start_date).getFullYear();
        if (!isNaN(y)) uniqueYears.add(y);
      }
      if (s.finish_date && !isYearOnly(s.finish_date)) {
        const y = parseDate(s.finish_date).getFullYear();
        if (!isNaN(y)) uniqueYears.add(y);
      }
    });
    const list = Array.from(uniqueYears).sort((a, b) => b - a);
    return list.length > 0 ? list : [new Date().getFullYear()];
  }, [normalizedSessions]);

  const [selectedYear, setSelectedYear] = useState<number>(() => years[0]);

  // Compute pro-rata monthly distribution
  const { chartData, activeMediaList } = useMemo(() => {
    const monthlyBuckets: { [mediaId: string]: number }[] = Array.from({ length: 12 }, () => ({}));
    const mediaTitles: { [mediaId: string]: string } = {};

    normalizedSessions.forEach(session => {
      if (!session.start_date || !session.finish_date) return;
      if (isYearOnly(session.start_date) || isYearOnly(session.finish_date)) return;

      const start = parseDate(session.start_date);
      const finish = parseDate(session.finish_date);
      if (isNaN(start.getTime()) || isNaN(finish.getTime())) return;

      // Inclusive days calculation
      const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const finishMidnight = new Date(finish.getFullYear(), finish.getMonth(), finish.getDate());
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffMs = finishMidnight.getTime() - startMidnight.getTime();
      const activeDays = Math.max(1, Math.round(diffMs / oneDayMs) + 1);

      const hoursPerDay = session.total_hours / activeDays;
      mediaTitles[session.media_id] = session.title;

      let currentDay = new Date(startMidnight.getTime());
      while (currentDay <= finishMidnight) {
        if (currentDay.getFullYear() === selectedYear) {
          const monthIndex = currentDay.getMonth();
          const mediaId = session.media_id;
          monthlyBuckets[monthIndex][mediaId] = (monthlyBuckets[monthIndex][mediaId] || 0) + hoursPerDay;
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = monthNames.map((name, index) => ({
      name,
      ...monthlyBuckets[index]
    }));

    const activeMediaIds = new Set<string>();
    monthlyBuckets.forEach(bucket => {
      Object.keys(bucket).forEach(id => activeMediaIds.add(id));
    });

    const mediaList = Array.from(activeMediaIds).map(id => ({
      id,
      title: mediaTitles[id] || 'Unknown Title'
    }));

    return { chartData: data, activeMediaList: mediaList };
  }, [sessions, selectedYear]);

  return (
    <section className="bg-surface rounded-xl p-6 bloom-shadow border border-surface-container-high relative flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-high">Consumption Timeline</h3>
          <p className="text-sm text-text-muted">Hour distribution stacked monthly across complete sessions.</p>
        </div>

        {/* Year Select Selector */}
        <div className="relative shrink-0 w-32">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full appearance-none bg-surface-container border border-outline-variant/10 rounded-xl pl-4 pr-10 py-2 text-sm text-text-high font-semibold cursor-pointer focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all select-none"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[18px] text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      <div className="w-full h-80 min-h-[320px]">
        {activeMediaList.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-60">
            <span className="material-symbols-outlined text-4xl text-text-muted mb-2">bar_chart_off</span>
            <p className="text-sm text-text-muted">No timeline sessions distributed for {selectedYear}.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--color-text-muted, #8e8e93)', fontSize: 12, fontWeight: 500 }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--color-text-muted, #8e8e93)', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip content={<CustomTooltip hoveredBarId={hoveredBarId} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              {activeMediaList.map((media, index) => (
                <Bar
                  key={media.id}
                  dataKey={media.id}
                  name={media.title}
                  stackId="a"
                  fill={getColor(index)}
                  radius={[0, 0, 0, 0]}
                  activeBar={false}
                  style={{ cursor: 'default' }}
                  onMouseEnter={() => setHoveredBarId(media.id)}
                  onMouseLeave={() => setHoveredBarId(null)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
