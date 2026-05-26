import { useMemo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number) {
  const pages: (number | string)[] = [];
  const delta = 2;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    } else if (
      (i === current - delta - 1 && i > 1) ||
      (i === current + delta + 1 && i < total)
    ) {
      pages.push('...');
    }
  }

  const result: (number | string)[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (pages[i] === '...' && result[result.length - 1] === '...') {
      continue;
    }
    result.push(pages[i]);
  }
  return result;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-16 flex items-center justify-center gap-1.5 flex-wrap">
      {/* Previous Page Chevron */}
      <button
        onClick={() => {
          onPageChange(Math.max(currentPage - 1, 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/10 text-text-muted hover:text-text-high hover:border-primary/30 disabled:opacity-40 disabled:hover:text-text-muted disabled:hover:border-outline-variant/10 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
      </button>

      {/* Pages & Ellipses */}
      {pageNumbers.map((p, idx) => {
        if (p === '...') {
          return (
            <span
              key={`dots-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-text-muted text-sm font-semibold select-none"
            >
              ...
            </span>
          );
        }

        const isCurrent = currentPage === p;

        return (
          <button
            key={p}
            onClick={() => {
              onPageChange(Number(p));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold tracking-tight transition-all cursor-pointer ${
              isCurrent
                ? 'bg-primary text-on-primary border border-primary shadow-md'
                : 'bg-surface-container-high border border-outline-variant/10 text-text-muted hover:text-text-high hover:border-primary/30'
            }`}
          >
            {p}
          </button>
        );
      })}

      {/* Next Page Chevron */}
      <button
        onClick={() => {
          onPageChange(Math.min(currentPage + 1, totalPages));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/10 text-text-muted hover:text-text-high hover:border-primary/30 disabled:opacity-40 disabled:hover:text-text-muted disabled:hover:border-outline-variant/10 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </button>
    </div>
  );
};
