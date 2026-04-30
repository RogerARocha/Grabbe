interface AlternativeTitlesProps {
  titles: string[];
}

export const AlternativeTitles = ({ titles }: AlternativeTitlesProps) => {
  if (titles.length === 0) return null;

  return (
    <div className="pt-8 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Alternative Titles</h3>
      <div className="flex flex-wrap gap-3">
        {titles.map((title, i) => (
          <span
            key={i}
            className={`bg-surface-container border border-outline-variant/10 px-4 py-2 rounded-lg text-sm font-medium text-text-base ${i > 0 ? 'opacity-50 italic' : ''}`}
          >
            {title}
          </span>
        ))}
      </div>
    </div>
  );
};
