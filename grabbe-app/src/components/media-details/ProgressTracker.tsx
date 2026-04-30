interface ProgressTrackerProps {
  currentProgress: number;
  totalProgress: number;
  label: string;
}

export const ProgressTracker = ({ currentProgress, totalProgress, label }: ProgressTrackerProps) => {
  const percent = Math.round((currentProgress / totalProgress) * 100);

  return (
    <div className="mt-6 bg-surface rounded-lg p-5 border border-outline-variant/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">In Progress</span>
        </div>
        <span className="text-xs font-bold text-text-muted">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-[11px] text-text-muted mt-2 font-medium">{label}</p>
    </div>
  );
};
