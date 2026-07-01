import React, { useState, useEffect } from 'react';

export interface GenreFilterModalProps {
  isOpen: boolean;
  availableGenres: string[];
  initialSelectedGenres: string[];
  onApply: (selectedGenres: string[]) => void;
  onClose: () => void;
}

/**
 * A premium, stylish multi-select Genre Filter Modal.
 */
export const GenreFilterModal: React.FC<GenreFilterModalProps> = ({
  isOpen,
  availableGenres,
  initialSelectedGenres,
  onApply,
  onClose,
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(initialSelectedGenres);

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(initialSelectedGenres);
    }
  }, [isOpen, initialSelectedGenres]);

  if (!isOpen) return null;

  const toggleGenre = (genre: string) => {
    setLocalSelected(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSelectAll = () => {
    setLocalSelected(availableGenres);
  };

  const handleClearAll = () => {
    setLocalSelected([]);
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#001b22]/75 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-lg bg-[#073642]/95 border border-white/10 border-t-2 border-t-[#00A3F5]/60 rounded-2xl shadow-2xl shadow-black/80 flex flex-col p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 bloom-shadow">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4 mb-4 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border bg-[#00A3F5]/10 border-[#00A3F5]/20 text-[#00A3F5] shrink-0">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </div>
            <h3 className="text-lg font-bold text-text-high leading-tight">
              Filter by Genre
            </h3>
          </div>
          
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-4 text-xs select-none">
          <button
            onClick={handleSelectAll}
            className="text-primary hover:underline font-bold"
          >
            Select All
          </button>
          <div className="w-[1px] h-4 bg-outline-variant/20" />
          <button
            onClick={handleClearAll}
            className="text-text-muted hover:text-text-high hover:underline font-bold"
          >
            Clear All
          </button>
        </div>

        {/* Genres Grid */}
        <div className="flex-1 max-h-[300px] overflow-y-auto pr-1 gap-2 grid grid-cols-2 sm:grid-cols-3 mb-6 select-none custom-scrollbar">
          {availableGenres.length > 0 ? (
            availableGenres.map((genre) => {
              const isChecked = localSelected.includes(genre);
              return (
                <div
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isChecked
                      ? 'bg-[#00A3F5]/10 border-[#00A3F5]/40 text-[#00A3F5] font-semibold'
                      : 'bg-surface-container/40 border-outline-variant/10 hover:border-outline-variant/30 text-text-muted hover:text-text-high'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isChecked 
                      ? 'bg-[#00A3F5] border-[#00A3F5]' 
                      : 'border-outline-variant/40'
                  }`}>
                    {isChecked && (
                      <span className="material-symbols-outlined text-[12px] text-[#001b22] font-black">check</span>
                    )}
                  </div>
                  <span className="text-xs truncate">{genre}</span>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-text-muted text-xs">
              No genres available to filter.
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex justify-end gap-3 select-none border-t border-outline-variant/10 pt-4">
          <button
            onClick={onClose}
            className="cursor-pointer bg-surface-container border border-outline-variant/30 text-text-high hover:bg-surface-container/80 text-xs font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
          >
            Cancel
          </button>
          
          <button
            onClick={handleApply}
            className="cursor-pointer text-xs font-bold px-5 py-2.5 rounded-xl transition-all bg-[#00A3F5] text-[#001b22] hover:bg-[#00A3F5]/90 active:scale-95 shadow-md shadow-[#00A3F5]/20 hover:shadow-[#00A3F5]/30"
          >
            Apply Filters {localSelected.length > 0 && `(${localSelected.length})`}
          </button>
        </div>

      </div>
    </div>
  );
};
