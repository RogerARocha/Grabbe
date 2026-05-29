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
      const hoursMatch = metricLower.match(/(\d+(?:[.,]\d+)?)\s*h/);
      const minsMatch = metricLower.match(/(\d+)\s*m/);
      
      let minsForGame = 0;
      if (hoursMatch || minsMatch) {
        const h = hoursMatch ? parseFloat(hoursMatch[1].replace(',', '.')) : 0;
        const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        minsForGame = Math.round((h * 60) + m);
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

/**
 * Uses the Largest Remainder Method with a minimum constraint of 1%.
 */
export function calculateAdjustedPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return counts.map(() => 0);
  }

  // Give minimum 1% to all non-zero categories
  const initialAllocated: number[] = counts.map(c => (c > 0 ? 1 : 0));
  const sumAllocated = initialAllocated.reduce((sum, val) => sum + val, 0);

  if (sumAllocated >= 100) {
    return initialAllocated;
  }

  const remaining = 100 - sumAllocated;

  // Compute proportional raw floats
  const rawFloats = counts.map((c, i) => {
    if (c === 0) return 0;
    return initialAllocated[i] + (c / total) * remaining;
  });

  const floorValues = rawFloats.map(Math.floor);
  const sumFloor = floorValues.reduce((sum, val) => sum + val, 0);
  const difference = 100 - sumFloor;

  const remainders = rawFloats.map((val, i) => ({
    index: i,
    remainder: val - floorValues[i],
    hasValue: counts[i] > 0
  }));

  remainders.sort((a, b) => {
    if (!a.hasValue) return 1;
    if (!b.hasValue) return -1;
    return b.remainder - a.remainder;
  });
 
  for (let i = 0; i < difference; i++) {
    const item = remainders[i];
    if (item && item.hasValue) {
      floorValues[item.index] += 1;
    }
  }

  return floorValues;
}