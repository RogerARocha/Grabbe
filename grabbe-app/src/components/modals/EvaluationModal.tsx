import { useState } from 'react';

export type EvaluationModalMode = 'add' | 'update';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: EvaluationModalMode;
  initialMediaName?: string;
}

export const EvaluationModal = ({ isOpen, onClose, mode, initialMediaName }: EvaluationModalProps) => {
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  if (!isOpen) return null;

  const isAddMode = mode === 'add';
  const title = isAddMode ? 'Add to Library' : 'Update Progress';
  const confirmText = isAddMode ? 'Add Media' : 'Save Changes';

  const scores = [
    { value: 10, label: 'Masterpiece', colorClass: 'prismatic-text-blue prismatic-text-blue-hover', bgHoverClass: 'hover:bg-error/10' },
    { value: 9, label: 'Great', colorClass: 'text-primary', bgHoverClass: 'hover:bg-primary/10' },
    { value: 8, label: 'Very Good', colorClass: 'text-secondary', bgHoverClass: 'hover:bg-secondary/10' },
    { value: 7, label: 'Good', colorClass: 'text-secondary', bgHoverClass: 'hover:bg-secondary/10' },
    { value: 6, label: 'Fine', colorClass: 'text-warning', bgHoverClass: 'hover:bg-warning/10' },
    { value: 5, label: 'Average', colorClass: 'text-warning', bgHoverClass: 'hover:bg-warning/10' },
    { value: 4, label: 'Bad', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
    { value: 3, label: 'Very Bad', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
    { value: 2, label: 'Horrible', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
    { value: 1, label: 'Appalling', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[420px] bg-surface rounded-[12px] p-6 bloom-shadow flex flex-col gap-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-high tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5">
          
          {/* Search Media (Only Add Mode) */}
          {isAddMode ? (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Search Media</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                <input 
                  type="text"
                  placeholder="Search for a movie, show, or book..."
                  className="w-full bg-background border-none rounded-lg text-sm pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Updating Progress For</label>
              <div className="bg-background rounded-lg text-sm px-4 py-3 text-text-high font-semibold border border-outline-variant/10">
                {initialMediaName || "Unknown Media"}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Status</label>
            <div className="relative">
              <select className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 appearance-none focus:ring-2 focus:ring-primary transition-all cursor-pointer text-text-high outline-none">
                <option>Currently Watching</option>
                <option>Completed</option>
                <option>On Hold</option>
                <option>Dropped</option>
                <option>Plan to Watch</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
            </div>
          </div>

          {/* Progress/Episode */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Progress / Episode</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                className="flex-1 bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none" 
                placeholder="0" 
              />
              <span className="text-text-muted font-medium text-sm">/ ?</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Start Date</label>
                <button className="text-[9px] font-bold text-primary hover:underline uppercase">Insert Today</button>
              </div>
              <input 
                type="date" 
                className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">End Date</label>
                <button className="text-[9px] font-bold text-primary hover:underline uppercase">Insert Today</button>
              </div>
              <input 
                type="date" 
                className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none" 
              />
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsScoreOpen(!isScoreOpen)}>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted cursor-pointer">Rating</label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Select Score
                </span>
                <span className="text-primary font-bold text-xs">{selectedScore ? selectedScore : '-'}/10</span>
                <span className="material-symbols-outlined text-text-muted text-[18px]">
                  {isScoreOpen ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </div>

            {/* Score Selector Dropdown */}
            {isScoreOpen && (
              <div className="mt-1 bg-background rounded-lg border border-outline-variant/30 overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  {scores.map((score) => (
                    <div 
                      key={score.value}
                      onClick={() => {
                        setSelectedScore(score.value);
                        setIsScoreOpen(false);
                      }}
                      className={`px-4 py-2.5 flex items-center justify-between group cursor-pointer border-b border-outline-variant/10 last:border-0 ${score.bgHoverClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${score.colorClass}`}>({score.value})</span>
                        <span className={`text-sm font-medium transition-colors ${score.colorClass.includes('prismatic') ? score.colorClass : `text-text-high ${score.colorClass.replace('text-', 'group-hover:text-')}`}`}>
                          {score.label}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-xs ${score.colorClass} ${selectedScore === score.value ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        check_circle
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/10 mt-2">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-text-high transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button className="px-8 py-2.5 bg-secondary hover:brightness-110 text-[#00412a] text-sm font-bold rounded-lg transition-all active:scale-95 bloom-shadow">
            {confirmText}
          </button>
        </div>
        
      </div>
    </div>
  );
};
