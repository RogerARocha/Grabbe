import React from 'react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns the number of days in a given month (1-based month). */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const YEAR_MIN = 1955;
/** Allow one year ahead for announced/upcoming titles. */
const YEAR_MAX = new Date().getFullYear() + 1;

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
function toComparableInt(s: string): number {
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

// ── Local helpers ──────────────────────────────────────────────────────────

function buildValue(year: string, month: string, day: string): string {
  if (!year || year.length < 4) return year; // incomplete year — intermediate state
  if (!month) return year;
  if (!day) return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

function previewLabel(val: string): string {
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

// ── Component ──────────────────────────────────────────────────────────────

interface PartialDateInputProps {
  /**
   * Controlled value as a partial-date string.
   * Accepts: "" | "YYYY" | "YYYY-MM" | "YYYY-MM-DD"
   */
  value: string;
  onChange: (value: string) => void;
  label: string;
  /**
   * The earliest year the user is allowed to enter.
   * Typically derived from the media's release date.
   */
  minYear?: number;
  /**
   * Another partial date that this date must not precede.
   * Used to enforce "end date ≥ start date".
   * Month and day options for earlier years are filtered accordingly.
   */
  minPartialDate?: string;
}

/**
 * A cascading partial-date picker that enforces "year first" granularity rules.
 *
 * Levels unlock progressively:
 *   Year (always visible) → Month (appears after valid year) → Day (appears after month)
 *
 * Clearing a higher-precision field cascades down:
 *   Clear year → also clears month and day.
 *   Clear month → also clears day.
 *
 * Constraints:
 *   - `minYear` prevents entering a year before the media's release year.
 *   - `minPartialDate` prevents selecting a date chronologically before it (e.g. end < start).
 */
export const PartialDateInput: React.FC<PartialDateInputProps> = ({
  value,
  onChange,
  label,
  minYear,
  minPartialDate,
}) => {
  const parts = (value || '').split('-');
  const yearStr  = parts[0] || '';
  const monthStr = parts[1] || '';
  const dayStr   = parts[2] || '';
  const yearNum  = yearStr.length === 4 ? parseInt(yearStr, 10) : null;
  const monthNum = monthStr ? parseInt(monthStr, 10) : null;

  // Parse the lower-bound date constraint
  const minParts  = (minPartialDate || '').split('-');
  const minPYear  = minParts[0] ? parseInt(minParts[0], 10) : null;
  const minPMonth = minParts[1] ? parseInt(minParts[1], 10) : null;
  const minPDay   = minParts[2] ? parseInt(minParts[2], 10) : null;

  // Effective minimum year: stricter of YEAR_MIN, the release-year constraint, and the minPartialDate constraint
  const effectiveMinYear = Math.max(YEAR_MIN, minYear ?? 0, minPYear ?? 0);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleYearChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (!digits) { onChange(''); return; }
    if (digits.length < 4) { onChange(digits); return; } // intermediate

    const yr = parseInt(digits, 10);
    // Clamp to [effectiveMinYear, YEAR_MAX]
    const clamped = Math.min(Math.max(yr, effectiveMinYear), YEAR_MAX);

    // Cascade: if the clamped year is the minPYear and current month is before minPMonth
    let m = monthStr;
    let d = dayStr;
    if (m && minPYear && clamped === minPYear && minPMonth && parseInt(m, 10) < minPMonth) {
      m = ''; d = '';
    }
    // Re-check day validity for new year (leap year edge case)
    if (m && d && getDaysInMonth(clamped, parseInt(m, 10)) < parseInt(d, 10)) d = '';

    onChange(buildValue(String(clamped), m, d));
  };

  const handleMonthChange = (m: string) => {
    if (!m) { onChange(yearStr); return; } // clearing month also clears day

    let d = dayStr;
    // Day overflow for new month
    if (yearNum && d && getDaysInMonth(yearNum, parseInt(m, 10)) < parseInt(d, 10)) d = '';
    // Day before minPDay in the boundary month
    if (yearNum === minPYear && parseInt(m, 10) === minPMonth && minPDay && d && parseInt(d, 10) < minPDay) d = '';

    onChange(buildValue(yearStr, m, d));
  };

  const handleDayChange = (d: string) => {
    onChange(buildValue(yearStr, monthStr, d));
  };

  const handleToday = () => {
    const n = new Date();
    onChange(
      `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
    );
  };

  // ── Derived option lists ──────────────────────────────────────────────────

  const showMonth = yearStr.length === 4;
  const showDay   = showMonth && !!monthStr;

  // Month lower bound: only applies when current year equals the constraint year
  const minMonthOption = (yearNum && minPYear && yearNum === minPYear) ? (minPMonth ?? 1) : 1;
  const monthOptions = MONTH_NAMES.map((name, i) => ({ v: String(i + 1).padStart(2, '0'), label: name }))
    .filter(m => parseInt(m.v, 10) >= minMonthOption);

  // Day lower bound: only applies when current year+month equals the constraint
  const maxDays = (yearNum && monthNum) ? getDaysInMonth(yearNum, monthNum) : 31;
  const minDayOption = (
    yearNum && monthNum && minPYear && minPMonth &&
    yearNum === minPYear && monthNum === minPMonth
  ) ? (minPDay ?? 1) : 1;
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1)
    .filter(d => d >= minDayOption)
    .map(d => ({ v: String(d).padStart(2, '0'), label: String(d) }));

  // ── Shared input classes ──────────────────────────────────────────────────

  const inputBase = 'bg-background border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all text-text-high outline-none';
  const selectBase = `appearance-none cursor-pointer ${inputBase}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </label>
        <div className="flex items-center gap-3">
          {/* Live preview of the current selection */}
          {value && value.length >= 4 && (
            <span className="text-[10px] font-medium text-primary/70 tabular-nums">
              {previewLabel(value)}
            </span>
          )}
          <button
            type="button"
            onClick={handleToday}
            className="text-[9px] font-bold text-primary hover:underline uppercase"
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[9px] font-bold text-text-muted hover:text-error uppercase hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Field row */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Year */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={yearStr}
          placeholder={`≥ ${effectiveMinYear}`}
          onChange={e => handleYearChange(e.target.value)}
          className={`w-18 px-3 py-2.5 ${inputBase}`}
        />

        {/* Month — only after a valid 4-digit year */}
        {showMonth && (
          <>
            <span className="text-text-muted/60 text-xs select-none">/</span>
            <div className="relative">
              <select
                value={monthStr}
                onChange={e => handleMonthChange(e.target.value)}
                className={`pl-3 pr-7 py-2.5 ${selectBase} animate-in fade-in duration-150`}
              >
                <option value="">Month</option>
                {monthOptions.map(m => (
                  <option key={m.v} value={m.v}>{m.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[14px] text-text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                expand_more
              </span>
            </div>
          </>
        )}

        {/* Day — only after a month is selected */}
        {showDay && (
          <>
            <span className="text-text-muted/60 text-xs select-none">/</span>
            <div className="relative">
              <select
                value={dayStr}
                onChange={e => handleDayChange(e.target.value)}
                className={`pl-3 pr-7 py-2.5 ${selectBase} animate-in fade-in duration-150`}
              >
                <option value="">Day</option>
                {dayOptions.map(d => (
                  <option key={d.v} value={d.v}>{d.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[14px] text-text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                expand_more
              </span>
            </div>
          </>
        )}
      </div>

      {/* Hint when no year is entered yet */}
      {!yearStr && (
        <p className="text-[10px] text-text-muted/50">
          Enter a year to continue adding precision.
        </p>
      )}
    </div>
  );
};

// Re-export the comparison helper so callers can validate date ordering
export { toComparableInt as partialDateToInt };
