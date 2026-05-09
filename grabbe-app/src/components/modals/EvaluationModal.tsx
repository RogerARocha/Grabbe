import { useState, useEffect, useRef } from 'react';
import { upsertMedia, saveTracking } from '../../lib/db';

export type EvaluationModalMode = 'add' | 'update';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: EvaluationModalMode;
  initialMediaName?: string;
  media?: any;
  initialStatus?: string;
  initialScore?: number;
  initialProgress?: number;
  initialStartDate?: string;
  initialEndDate?: string;
  initialReviewText?: string;
}

/**
 * Modal component for adding new media to the library or updating existing tracking progress.
 * Handles API search integration for new items and local database synchronization.
 */
export const EvaluationModal = ({ 
  isOpen, 
  onClose, 
  mode, 
  initialMediaName, 
  media, 
  initialStatus, 
  initialScore, 
  initialProgress,
  initialStartDate,
  initialEndDate,
  initialReviewText
}: EvaluationModalProps) => {
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [status, setStatus] = useState('CONSUMING');
  const [progress, setProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMedia(media || null);
      setStatus(initialStatus || 'CONSUMING');
      setSelectedScore(initialScore || null);
      setProgress(initialProgress || 0);
      setTotalProgress(media?.totalProgressUnits || 0);
      setReviewText(initialReviewText || '');
      
      // format dates to YYYY-MM-DD if they are full ISO strings
      setStartDate(initialStartDate ? initialStartDate.split('T')[0] : '');
      setEndDate(initialEndDate ? initialEndDate.split('T')[0] : '');
      
      setSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [isOpen, initialStatus, initialScore, initialProgress, media, initialStartDate, initialEndDate, initialReviewText]);

  if (!isOpen) return null;

  const isAddMode = mode === 'add';
  const showSearch = isAddMode && !media;
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

  /**
   * Performs an external API search for media.
   * This is debounced via handleQueryChange to prevent excessive API calls.
   */
  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:5244/api/v1/search?query=${encodeURIComponent(q)}&page=1`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 400);
  };

  const handleSelectResult = async (result: any) => {
    setSearchQuery(result.title);
    setShowDropdown(false);
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:5244/api/v1/media/${result.sourceApi}/${result.type}/${result.externalId}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const data = await response.json();
      setSelectedMedia(data.data);
      setTotalProgress(data.data.totalProgressUnits || 0);
    } catch (e) {
      console.error('Failed to fetch media details', e);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Saves tracking data to the local SQLite database.
   * Follows a local-first pipeline:
   * 1. Upserts the core media definition.
   * 2. Synchronizes tracking progress, session dates, and user ranking.
   */
  const handleSave = async () => {
    try {
      if (selectedMedia) {
        const mediaId = await upsertMedia(selectedMedia);
        const finalTotalProgress = totalProgress || selectedMedia.totalProgressUnits || null;
        await saveTracking(mediaId, status, selectedScore, progress, finalTotalProgress, reviewText || null, startDate || null, endDate || null);
      }
      onClose();
    } catch (e) {
      console.error("Failed to save media tracking", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[420px] bg-surface rounded-[12px] p-6 bloom-shadow flex flex-col gap-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-high tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          
          {showSearch ? (
            <div className="flex flex-col gap-2 relative">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Search Media</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={handleQueryChange}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  placeholder="Search for a movie, show, or book..."
                  className="w-full bg-background border-none rounded-lg text-sm pl-10 pr-10 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none"
                />
                {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />}
              </div>
              
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full mt-2 bg-surface rounded-lg border border-outline-variant/30 overflow-hidden z-50 max-h-[240px] overflow-y-auto bloom-shadow">
                  {searchResults.map((res) => (
                    <div 
                      key={res.externalId} 
                      onClick={() => handleSelectResult(res)}
                      className="flex gap-3 p-3 cursor-pointer hover:bg-surface-container transition-colors border-b border-outline-variant/10 last:border-0"
                    >
                      {res.coverImageUrl ? (
                        <img src={res.coverImageUrl} className="w-10 h-14 object-cover rounded bg-background" alt="" />
                      ) : (
                        <div className="w-10 h-14 bg-background rounded flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-text-muted">image</span>
                        </div>
                      )}
                      <div className="flex flex-col justify-center overflow-hidden">
                        <span className="text-sm font-bold text-text-high truncate">{res.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase text-text-muted bg-background px-1.5 py-0.5 rounded">{res.type}</span>
                          <span className="text-[10px] text-text-muted">{res.releaseDate?.substring(0, 4) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                {isAddMode ? 'Adding to Library' : 'Updating Progress For'}
              </label>
              <div className="bg-background rounded-lg text-sm px-4 py-3 text-text-high font-semibold border border-outline-variant/10">
                {initialMediaName || selectedMedia?.title || "Unknown Media"}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Status</label>
            <div className="relative">
              <select 
                value={status} 
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setStatus(newStatus);
                  if (newStatus === 'COMPLETED') {
                    if (totalProgress > 0) setProgress(totalProgress);
                    if (!endDate) setEndDate(new Date().toISOString().split('T')[0]);
                  } else if (newStatus === 'CONSUMING') {
                    if (!startDate) setStartDate(new Date().toISOString().split('T')[0]);
                  }
                }} 
                className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 appearance-none focus:ring-2 focus:ring-primary transition-all cursor-pointer text-text-high outline-none">
                <option value="CONSUMING">Currently Watching / Reading</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON HOLD">On Hold</option>
                <option value="DROPPED">Dropped</option>
                <option value="PLANNED">Plan to Watch</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Progress / Episode</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgress(val);
                  if (totalProgress > 0 && val >= totalProgress) {
                    setStatus('COMPLETED');
                    if (!endDate) setEndDate(new Date().toISOString().split('T')[0]);
                  }
                }}
                className="flex-1 bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none" 
                placeholder="0" 
              />
              <span className="text-text-muted font-medium text-sm">/ {totalProgress || '?'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Start Date</label>
                <button 
                  onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                  className="text-[9px] font-bold text-primary hover:underline uppercase"
                >Insert Today</button>
              </div>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none [color-scheme:dark]" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">End Date</label>
                <button 
                  onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                  className="text-[9px] font-bold text-primary hover:underline uppercase"
                >Insert Today</button>
              </div>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none [color-scheme:dark]" 
              />
            </div>
          </div>

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
          
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Review & Notes</label>
            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think about it?"
              className="w-full bg-background border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-text-high outline-none resize-none min-h-[80px]"
            />
          </div>

        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/10 mt-2">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-text-high transition-colors active:scale-95">
            Cancel
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 bg-secondary hover:brightness-110 text-[#00412a] text-sm font-bold rounded-lg transition-all active:scale-95 bloom-shadow">
            {confirmText}
          </button>
        </div>
        
      </div>
    </div>
  );
};
