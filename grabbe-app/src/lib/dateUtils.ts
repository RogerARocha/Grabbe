export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns the number of days in a given month (1-based month). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export const YEAR_MIN = 1955;
/** Allow one year ahead for announced/upcoming titles. */
export const YEAR_MAX = new Date().getFullYear() + 1;

/**
 * Normalises any raw date value from the DB into a clean partial-date string:
 *   "" | "YYYY" | "YYYY-MM" | "YYYY-MM-DD"
 *
 * Handles:
 *  - JS numbers (SQLite NUMERIC affinity coerces "2024" → integer 2024)
 *  - ISO datetimes with time components ("2024-05-20T00:00:00" → "2024-05-20")
 *  - MAL-style zero sentinels: "2022-00-00" or "2022-00" → "2022"
 *    (MAL uses 00 for unknown month/day, not a real date)
 */
export function parsePartialDate(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined || raw === '' || raw === 0) return '';
  // Coerce number → string (SQLite NUMERIC affinity edge case)
  const base = String(raw).split('T')[0];
  if (!base) return '';
  const parts = base.split('-');
  // Strip trailing zero-sentinel parts (MAL exports year-only as "YYYY-00-00")
  while (parts.length > 1 && (parts[parts.length - 1] === '00' || parts[parts.length - 1] === '0')) {
    parts.pop();
  }
  return parts.join('-');
}

/**
 * Converts a partial-date string to a sortable integer for chronological
 * comparison.  Missing precision levels default to 0, so "2024" < "2024-05".
 */
export function partialDateToInt(s: string): number {
  if (!s || s.length < 4) return 0;
  const p = s.split('-');
  return (
    parseInt(p[0] || '0', 10) * 10000 +
    parseInt(p[1] || '0', 10) * 100 +
    parseInt(p[2] || '0', 10)
  );
}

/**
 * Returns a human-readable preview of a partial date string.
 *   "2024"       → "2024"
 *   "2024-05"    → "May 2024"
 *   "2024-05-20" → "May 20, 2024"
 */
export function formatPartialDate(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined || raw === '' || raw === 0) return '—';
  // Normalise via parsePartialDate so zero-sentinels are stripped first
  const val = parsePartialDate(raw);
  if (!val) return '—';

  const parts = val.split('-');

  // Year only
  if (parts.length === 1 && /^\d{1,4}$/.test(parts[0])) return parts[0];

  // Year + Month
  if (parts.length === 2) {
    const m = parseInt(parts[1], 10);
    const name = MONTH_NAMES[m - 1];
    return name ? `${name} ${parts[0]}` : val;
  }

  // Year + Month + Day
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const name = MONTH_NAMES[m - 1];
    return name ? `${name} ${d}, ${parts[0]}` : val;
  }

  // Fallback for legacy full ISO datetimes that may already be in the DB
  const date = new Date(raw as string);
  return isNaN(date.getTime())
    ? String(raw)
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function buildValue(year: string, month: string, day: string): string {
  if (!year || year.length < 4) return year; // incomplete year — intermediate state
  if (!month) return year;
  if (!day) return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

export function previewLabel(val: string): string {
  if (!val || val.length < 4) return '';
  const parts = val.split('-');
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    const m = parseInt(parts[1], 10);
    return `${MONTH_NAMES_FULL[m - 1] ?? '?'} ${parts[0]}`;
  }
  const m = parseInt(parts[1], 10);
  return `${MONTH_NAMES_FULL[m - 1] ?? '?'} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

export const isYearOnly = (dStr: any): boolean => {
  if (!dStr) return true;
  if (dStr instanceof Date) return false;
  if (typeof dStr === 'number') return false;
  const str = String(dStr);
  return /^\d{4}$/.test(str.trim());
};

export const parseDate = (dStr: any): Date => {
  if (dStr instanceof Date) return dStr;
  if (typeof dStr === 'number') return new Date(dStr);
  const str = String(dStr || '');
  const normalized = str.includes(' ') ? str.replace(' ', 'T') + 'Z' : str;
  return new Date(normalized);
};
