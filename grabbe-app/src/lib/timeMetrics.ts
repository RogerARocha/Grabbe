/**
 * Calculates the total invested time in minutes based on the media type,
 * its formatted metric string, and the user's progress.
 *
 * @param type The media type (e.g., MOVIE, ANIME, SERIES, BOOK, GAME)
 * @param formattedMetric The raw metric string from the DTO (e.g., "2h 49m", "24 min per ep", "450 pages", "15h")
 * @param progress The user's current progress (episodes, pages, or 1 for completed movies/games)
 * @returns The total invested time in minutes
 */
export function calculateInvestedMinutes(
  type: string, 
  formattedMetric: string | null | undefined, 
  progress: number
): number {
  if (progress <= 0) return 0;

  const metricLower = (formattedMetric || '').toLowerCase();
  let totalMinutes = 0;

  switch (type.toUpperCase()) {
    case 'MOVIE': {
      const hoursMatch = metricLower.match(/(\d+)\s*h/);
      const minsMatch = metricLower.match(/(\d+)\s*m/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : (formattedMetric ? 0 : 2);
      const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
      
      totalMinutes = ((hours * 60) + mins) * progress;
      break;
    }

    case 'ANIME':
    case 'SERIES': {
      const hoursMatch = metricLower.match(/(\d+)\s*h/);
      const minsMatch = metricLower.match(/(\d+)\s*m/); 
      
      let minsPerEp = 0;
      if (hoursMatch || minsMatch) {
        const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        minsPerEp = (h * 60) + m;
      } else {
        minsPerEp = formattedMetric ? 0 : 24;
      }
      
      totalMinutes = minsPerEp * progress;
      break;
    }

    case 'BOOK':
    case 'MANGA':
    case 'COMIC': {
      // For reading material, progress is usually the amount of pages or chapters.
      // Estimate: 1.5 minutes per unit.
      totalMinutes = Math.floor(progress * 1.5);
      break;
    }

    case 'GAME': {
      const hoursMatch = metricLower.match(/(\d+)\s*h/);
      const minsMatch = metricLower.match(/(\d+)\s*m/);
      
      let minsForGame = 0;
      if (hoursMatch || minsMatch) {
        const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        minsForGame = (h * 60) + m;
      } else {
        minsForGame = formattedMetric ? 0 : (15 * 60);
      }
      
      totalMinutes = minsForGame * progress;
      break;
    }
  }

  return totalMinutes;
}

/**
 * Converts a total number of minutes into a human-readable string.
 *
 * @param totalMinutes The total minutes to convert
 * @returns A formatted string like "57h 30m"
 */
export function formatTotalHours(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0h 0m";
  
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}m`;
}