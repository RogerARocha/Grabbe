import React, { useState, useEffect } from 'react';
import { getLibraryItems } from '../../lib/db';
import { TypeFilters } from '../shared/TypeFilters';
import { MediaType } from '../shared/types';

export interface ProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: any) => void;
  alreadyPinnedIds: string[];
}

export const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  alreadyPinnedIds,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<MediaType>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getLibraryItems().then((all) => {
        if (all) {
          setItems(all);
        }
        setLoading(false);
      }).catch((err) => {
        console.error('Failed to load library items:', err);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'ALL' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#001b22]/80 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-black/90 flex flex-col p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 bloom-shadow max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-text-high">Pin Media to Profile</h3>
            <p className="text-xs text-text-muted mt-1">Select a favorite work from your library to feature in your Hall of Fame.</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-high transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search and Tabs */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm pl-10 pr-4 py-2.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/50"
            />
          </div>

          <TypeFilters activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Library Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[250px] max-h-[45vh] space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-xs">Loading library items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="material-symbols-outlined text-[48px] text-text-muted/30">movie_filter</span>
              <div>
                <p className="text-sm font-bold text-text-muted">No items found</p>
                <p className="text-xs text-text-muted/70 mt-1">Try resetting filters or adding more works to your library.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {filteredItems.map((item) => {
                const isAlreadyPinned = alreadyPinnedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    disabled={isAlreadyPinned}
                    onClick={() => onSelect(item)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all select-none w-full group ${isAlreadyPinned
                      ? 'border-white/5 bg-white/2 opacity-40 cursor-not-allowed'
                      : 'border-white/5 bg-surface-container hover:bg-surface-container/80 hover:border-primary/30 active:scale-[0.99] cursor-pointer'
                      }`}
                  >
                    {/* Cover Image */}
                    <div className="w-11 h-15 rounded-lg bg-background border border-white/5 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.cover_image_path ? (
                        <img
                          src={item.cover_image_path}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                          }}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-text-muted/40">image</span>
                      )}

                      {/* Floating type badge */}
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] font-bold px-1 py-0.5 rounded bg-black/70 text-text-high">
                        {item.type}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-high truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.score && (
                          <span className="flex items-center gap-0.5 text-xs text-[#FEA800] font-bold">
                            <span className="material-symbols-outlined text-[12px] fill-amber-500">star</span>
                            {item.score}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${item.status === 'COMPLETED' ? 'bg-[#53EAAA]/10 text-[#53EAAA]' :
                          item.status === 'CONSUMING' ? 'bg-[#00A3F5]/10 text-[#00A3F5]' :
                            'bg-white/5 text-text-muted'
                          }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="text-text-muted/40 group-hover:text-primary shrink-0 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">
                        {isAlreadyPinned ? 'check_circle' : 'add_circle'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
          <button
            onClick={onClose}
            className="cursor-pointer bg-surface-container border border-outline-variant/30 text-text-high hover:bg-surface-container/80 text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
