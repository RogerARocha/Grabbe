import { isYearOnly, parseDate } from './dateUtils';

export interface MediaSession {
  start_date: string;
  finish_date: string;
  total_hours: number;
  media_id: string;
  title: string;
  type: string;
}

/**
 * Normalises raw user consumption sessions.
 * Ensures if start_date is missing, it defaults to finish_date,
 * and filters out any sessions missing both dates.
 *
 * @param sessions The raw media sessions array
 * @returns An array of normalized sessions
 */
export function getNormalizedSessions(sessions: MediaSession[]): MediaSession[] {
  return sessions
    .map(s => ({
      ...s,
      start_date: s.start_date || s.finish_date
    }))
    .filter(s => s.start_date && s.finish_date);
}

/**
 * Extracts all unique years available from full dates in sessions, sorted descending.
 * Defaults to the current year if no valid years are found.
 *
 * @param normalizedSessions Normalized media sessions array
 * @returns Array of unique year numbers sorted descending
 */
export function getTimelineYears(normalizedSessions: MediaSession[]): number[] {
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
}

/**
 * Computes pro-rata monthly hour distribution across complete sessions for a given year.
 *
 * @param normalizedSessions List of normalized sessions to distribute
 * @param selectedYear The active target year to filter and distribute by
 * @returns An object containing chartData format for recharts and the activeMediaList
 */
export function calculateProRataConsumption(
  normalizedSessions: MediaSession[],
  selectedYear: number
): {
  chartData: Array<{ name: string; [mediaId: string]: any }>;
  activeMediaList: Array<{ id: string; title: string }>;
} {
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
}
