import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { getLibraryItems, getConsumptionSessions } from '../lib/db';
import { AnalyticsHero } from '../components/analytics/AnalyticsHero';
import { CategoryGrid } from '../components/analytics/CategoryGrid';
import { CriticalTaste } from '../components/analytics/CriticalTaste';
import { GeneralStatus } from '../components/analytics/GeneralStatus';
import { ConsumptionTimeline } from '../components/analytics/ConsumptionTimeline';
import { calculateInvestedMinutes } from '../lib/timeMetrics';

export const Analytics = () => {
  const [items, setItems] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    getLibraryItems().then((all) => {
      if (all) setItems(all);
    });

    getConsumptionSessions().then((rawSessions) => {
      if (rawSessions) {
        const mapped = rawSessions.map(s => {
          const minutes = calculateInvestedMinutes(s.type, s.consumption_metric, s.progress || 0);
          return {
            start_date: s.start_date,
            finish_date: s.finish_date,
            total_hours: minutes / 60,
            media_id: s.media_id,
            title: s.title,
            type: s.type
          };
        });
        setSessions(mapped);
      }
    });
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-high mb-2">Analytics</h1>
          <p className="text-text-muted">A deep dive into your consumption habits and library statistics.</p>
        </div>

        {/* Hero Section: Total Lifetime */}
        <AnalyticsHero items={items} />

        {/* Category Grid */}
        <CategoryGrid items={items} />

        {/* Quality Analysis & Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CriticalTaste items={items} />
          <GeneralStatus items={items} />
        </div>

        {/* Consuming Timeline Space */}
        <ConsumptionTimeline sessions={sessions} />
      </div>
    </MainLayout>
  );
};
