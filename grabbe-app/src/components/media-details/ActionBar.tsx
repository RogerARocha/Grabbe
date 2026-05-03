interface ActionBarProps {
  isInLibrary: boolean;
  status?: string;
  userScore?: number;
  onAdd: () => void;
  onUpdate: () => void;
  onRemove: () => void;
}

const statusMap: Record<string, string> = {
  'PLANNED': 'Planned',
  'CONSUMING': 'Watching/Reading',
  'COMPLETED': 'Completed',
  'DROPPED': 'Dropped',
  'ON_HOLD': 'On Hold'
};

export const ActionBar = ({ isInLibrary, status, userScore, onAdd, onUpdate, onRemove }: ActionBarProps) => {
  if (isInLibrary) {
    return (
      <div className="flex items-center gap-6 pt-4">
        <button onClick={onUpdate} className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/20 transition-all group">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-sm font-bold text-primary">{status ? (statusMap[status] || status) : 'Watching'}</span>
          <span className="material-symbols-outlined text-primary text-lg">expand_more</span>
        </button>

        <button onClick={onUpdate} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant/10 rounded-lg cursor-pointer hover:border-tertiary/50 transition-all">
          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">My Score</span>
          <span className="text-sm font-black prismatic-text">{userScore ?? '-'}/10</span>
        </button>

        <button onClick={onRemove} className="text-xs font-bold text-text-muted hover:text-error transition-colors px-2 py-1">
          Remove
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button className="p-3 rounded-lg bg-surface-container border border-outline-variant/10 text-text-muted hover:text-text-high transition-all">
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 pt-4">
      <button onClick={onAdd} className="bg-primary hover:brightness-110 text-on-primary font-bold px-12 py-4 rounded-lg transition-all flex items-center gap-3 primary-glow group min-w-[200px] justify-center">
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
        Add to List
      </button>
      <button className="p-4 rounded-lg bg-surface-container border border-outline-variant/10 text-text-muted hover:text-text-high transition-all">
        <span className="material-symbols-outlined">share</span>
      </button>
    </div>
  );
};
