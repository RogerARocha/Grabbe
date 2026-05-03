interface ProgressTrackerProps {
  currentProgress: number;
  totalProgress: number;
  label: string;
  onUpdate?: () => void;
}

export const ProgressTracker = ({ currentProgress, totalProgress, label, onUpdate }: ProgressTrackerProps) => {
  const percent = Math.min(Math.round((currentProgress / (totalProgress || 1)) * 100), 100);

  return (
    <div className="mt-6 bg-surface rounded-lg p-5 border border-outline-variant/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">In Progress</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black prismatic-text">{currentProgress} / {totalProgress || '?'}</span>
          <span className="text-xs font-bold text-text-muted">{percent}%</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        {onUpdate && (
          <button 
            onClick={onUpdate}
            className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:brightness-110 active:scale-90 transition-all primary-glow shadow-lg"
            title="Quick +1"
          >
            <span className="material-symbols-outlined text-base">add</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-text-muted mt-3 font-medium opacity-70">{label}</p>
    </div>
  );
};
