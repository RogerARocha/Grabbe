import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getDb, 
  getUnlinkedMediaItems, 
  markMediaAsCustom, 
  linkMediaItem, 
  mergeMediaRecords, 
  deleteMediaRecord, 
  type UnlinkedMediaItem, 
  type LocalMatchItem,
  type MergeOverrides
} from '../../lib/db';
import { apiFetch } from '../../lib/httpClient';
import { useToast } from '../../contexts/ToastContext';
import { getTypeLabel } from '../../lib/mediaUtils';
import { formatStatusLabel } from '../../lib/statusUtils';
import { ConfirmationModal } from './ConfirmationModal';
import { MergeConflictModal, analyzeMergeDiscrepancies } from './MergeConflictModal';

interface UnlinkedMediaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemResolved?: () => void;
}

interface CarouselItem extends UnlinkedMediaItem {
  resolutionStatus?: 'pending' | 'linked' | 'ignored';
  resolvedResultTitle?: string;
  resolvedCoverUrl?: string | null;
}

const SEARCH_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Providers' },
  { value: 'MOVIE', label: 'Film' },
  { value: 'SERIES', label: 'Series' },
  { value: 'ANIME', label: 'Anime' },
  { value: 'MANGA', label: 'Manga' },
  { value: 'BOOK', label: 'Book' },
  { value: 'GAME', label: 'Game' },
];

/**
 * Interactive card carousel modal that guides users through unlinked or placeholder
 * media entries in their library. Features automated provider suggestions, custom search,
 * 1-click linking, and ignore/custom capabilities with stable progress tracking.
 */
export const UnlinkedMediaAssistantModal = ({
  isOpen,
  onClose,
  onItemResolved
}: UnlinkedMediaAssistantModalProps) => {
  const { showToast } = useToast();

  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingMergeMatch, setPendingMergeMatch] = useState<LocalMatchItem | null>(null);
  const [pendingMergeAutoOverrides, setPendingMergeAutoOverrides] = useState<MergeOverrides | null>(null);
  const [conflictMatchTarget, setConflictMatchTarget] = useState<LocalMatchItem | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load unlinked items from SQLite once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsLoadingItems(true);

    getUnlinkedMediaItems()
      .then((unlinked) => {
        if (!active) return;
        const mapped: CarouselItem[] = unlinked.map((item) => ({
          ...item,
          resolutionStatus: 'pending'
        }));
        setItems(mapped);
        setCurrentIndex(0);
        setIsLoadingItems(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load unlinked items:', err);
        showToast('Failed to load unlinked media items.', 'error');
        setIsLoadingItems(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const totalCount = items.length;
  const resolvedCount = items.filter(
    (i) => i.resolutionStatus === 'linked' || i.resolutionStatus === 'ignored'
  ).length;
  const allResolved = totalCount > 0 && items.every((i) => i.resolutionStatus !== 'pending');

  const currentItem: CarouselItem | undefined = items[currentIndex];

  // Perform search against Grabbe BFF
  const executeSearch = useCallback(async (query: string, mediaType?: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const activeType = mediaType !== undefined ? mediaType : searchType;
      const typeParam = activeType && activeType !== 'ALL' ? `&type=${encodeURIComponent(activeType)}` : '';
      const response = await apiFetch(`/api/v1/search?query=${encodeURIComponent(query)}${typeParam}&page=1`);
      if (response.ok) {
        const body = await response.json();
        setSearchResults(body.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Provider search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType]);

  // Sync search query whenever current card changes
  useEffect(() => {
    if (!currentItem) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    const title = currentItem.title || '';
    setSearchQuery(title);
    executeSearch(title, searchType);
  }, [currentItem, executeSearch]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      executeSearch(val, searchType);
    }, 350);
  };

  const handleTypeSelect = (type: string) => {
    setSearchType(type);
    if (searchQuery.trim()) {
      executeSearch(searchQuery, type);
    }
  };

  const navigateToMedia = useCallback((targetIndex: number, direction: 'left' | 'right') => {
    if (targetIndex < 0 || targetIndex >= items.length || targetIndex === currentIndex) return;

    setSlideDirection(direction);
    setCurrentIndex(targetIndex);
  }, [currentIndex, items.length]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      navigateToMedia(currentIndex + 1, 'right');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      navigateToMedia(currentIndex - 1, 'left');
    }
  };

  // Find next pending/unresolved item after an action
  const advanceToNextPending = (currentIdx: number, updatedItems: CarouselItem[]) => {
    // 1. Look ahead
    let nextIdx = -1;
    for (let i = currentIdx + 1; i < updatedItems.length; i++) {
      if (!updatedItems[i].resolutionStatus || updatedItems[i].resolutionStatus === 'pending') {
        nextIdx = i;
        break;
      }
    }
    // 2. Look behind if any skipped
    if (nextIdx === -1) {
      for (let i = 0; i < currentIdx; i++) {
        if (!updatedItems[i].resolutionStatus || updatedItems[i].resolutionStatus === 'pending') {
          nextIdx = i;
          break;
        }
      }
    }

    if (nextIdx !== -1) {
      navigateToMedia(nextIdx, 'right');
    }
  };

  // 1-Click Link & Update action
  const handleLink = async (result: any) => {
    if (!currentItem || isProcessing) return;
    setIsProcessing(true);

    try {
      await linkMediaItem(currentItem.id, {
        externalId: result.externalId,
        sourceApi: result.sourceApi,
        type: result.type,
        title: result.title,
        coverImageUrl: result.coverImageUrl || null,
        description: result.description || null,
        releaseDate: result.releaseDate || null,
        genres: result.genres || null,
        communityScore: result.communityScore,
        publisherOrStudio: result.publisherOrStudio || null,
        originalLanguage: result.originalLanguage || null,
        formattedConsumptionMetric: result.formattedConsumptionMetric || null,
        totalProgressUnits: result.totalProgressUnits
      });

      showToast(`Linked "${result.title}" successfully!`, 'success');

      setItems((prev) => {
        const next = [...prev];
        next[currentIndex] = {
          ...next[currentIndex],
          resolutionStatus: 'linked',
          resolvedResultTitle: result.title,
          resolvedCoverUrl: result.coverImageUrl || null
        };
        advanceToNextPending(currentIndex, next);
        return next;
      });

      onItemResolved?.();
    } catch (err) {
      console.error('Failed to link item:', err);
      showToast('Failed to link media item.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep as Custom / Ignore action
  const handleKeepAsCustom = async () => {
    if (!currentItem || isProcessing) return;
    setIsProcessing(true);

    try {
      await markMediaAsCustom(currentItem.id);
      showToast(`Marked "${currentItem.title}" as custom.`, 'info');

      setItems((prev) => {
        const next = [...prev];
        next[currentIndex] = {
          ...next[currentIndex],
          resolutionStatus: 'ignored'
        };
        advanceToNextPending(currentIndex, next);
        return next;
      });

      onItemResolved?.();
    } catch (err) {
      console.error('Failed to mark item as custom:', err);
      showToast('Failed to update media status.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Prompt confirmation or conflict resolution before merging unlinked entry
  const handleMergeWithLocal = (match: LocalMatchItem) => {
    if (!currentItem || isProcessing) return;

    const analysis = analyzeMergeDiscrepancies(currentItem, match);

    if (analysis.hasRealDiscrepancy) {
      setConflictMatchTarget(match);
    } else {
      setPendingMergeAutoOverrides(analysis.autoOverrides);
      setPendingMergeMatch(match);
    }
  };

  // Action: Confirmed merge with custom field overrides from MergeConflictModal
  const confirmMergeWithOverrides = async (overrides: MergeOverrides) => {
    if (!conflictMatchTarget || !currentItem || isProcessing) return;
    const targetMatch = conflictMatchTarget;
    setConflictMatchTarget(null);
    setIsProcessing(true);

    try {
      const db = await getDb();
      await mergeMediaRecords(db, targetMatch.id, currentItem.id, overrides);
      showToast(`Merged "${currentItem.title}" into existing library entry.`, 'success');

      setItems((prev) => {
        const next = [...prev];
        next[currentIndex] = {
          ...next[currentIndex],
          resolutionStatus: 'linked',
          resolvedResultTitle: targetMatch.title,
          resolvedCoverUrl: targetMatch.coverImagePath || null
        };
        advanceToNextPending(currentIndex, next);
        return next;
      });

      onItemResolved?.();
    } catch (err) {
      console.error('Failed to merge local entries with overrides:', err);
      showToast('Failed to merge media records.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Confirmed merge of unlinked entry into local linked entry
  const confirmMergeWithLocal = async () => {
    if (!pendingMergeMatch || !currentItem || isProcessing) return;
    const matchToMerge = pendingMergeMatch;
    const autoOverrides = pendingMergeAutoOverrides || undefined;
    setPendingMergeMatch(null);
    setPendingMergeAutoOverrides(null);
    setIsProcessing(true);

    try {
      const db = await getDb();
      await mergeMediaRecords(db, matchToMerge.id, currentItem.id, autoOverrides);
      showToast(`Merged "${currentItem.title}" into existing library entry.`, 'success');

      setItems((prev) => {
        const next = [...prev];
        next[currentIndex] = {
          ...next[currentIndex],
          resolutionStatus: 'linked',
          resolvedResultTitle: matchToMerge.title,
          resolvedCoverUrl: matchToMerge.coverImagePath || null
        };
        advanceToNextPending(currentIndex, next);
        return next;
      });

      onItemResolved?.();
    } catch (err) {
      console.error('Failed to merge local entries:', err);
      showToast('Failed to merge media records.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Prompt confirmation before deleting unlinked entry
  const handleDeleteUnlinkedItem = () => {
    if (!currentItem || isProcessing) return;
    setIsDeleteConfirmOpen(true);
  };

  // Action: Confirmed deletion of unlinked entry completely from SQLite
  const confirmDeleteUnlinkedItem = async () => {
    setIsDeleteConfirmOpen(false);
    if (!currentItem || isProcessing) return;
    setIsProcessing(true);

    try {
      await deleteMediaRecord(currentItem.id);
      showToast(`Removed entry "${currentItem.title}".`, 'info');

      setItems((prev) => {
        const next = [...prev];
        next[currentIndex] = {
          ...next[currentIndex],
          resolutionStatus: 'ignored'
        };
        advanceToNextPending(currentIndex, next);
        return next;
      });

      onItemResolved?.();
    } catch (err) {
      console.error('Failed to delete unlinked duplicate record:', err);
      showToast('Failed to remove duplicate entry.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissLocalMatch = (matchId: string) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[currentIndex];
      if (current && current.possibleLocalMatches) {
        next[currentIndex] = {
          ...current,
          possibleLocalMatches: current.possibleLocalMatches.filter((m) => m.id !== matchId)
        };
      }
      return next;
    });
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface border border-outline-variant/30 rounded-2xl bloom-shadow flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header with Progress Bar */}
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-high tracking-tight">
                Media Link Assistant
              </h2>
              {totalCount > 0 && !allResolved && (
                <p className="text-xs text-text-muted">
                  Item <span className="text-primary font-bold">{currentIndex + 1}</span> of <span className="font-bold">{totalCount}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Step Indicator */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/15">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[11px] font-bold text-text-high">
                  {resolvedCount} of {totalCount} resolved
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-text-muted hover:text-text-high hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        {totalCount > 0 && (
          <div className="h-1 bg-surface-container-high w-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
              style={{ width: `${(resolvedCount / totalCount) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-start">
          {isLoadingItems ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <p className="text-xs text-text-muted">Scanning library for unlinked items...</p>
            </div>
          ) : totalCount === 0 || allResolved ? (
            /* All Items Resolved State */
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center mb-4 text-secondary shadow-lg shadow-secondary/20">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <h3 className="text-2xl font-black text-text-high tracking-tight mb-2">
                All Caught Up!
              </h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                All media items in your library have official metadata links or have been designated as custom. Your collection is fully organized!
              </p>
              {resolvedCount > 0 && (
                <div className="mb-6 px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/10 text-xs text-secondary font-medium">
                  {resolvedCount} of {totalCount} items were updated during this session.
                </div>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-secondary text-[#003822] text-sm font-bold rounded-xl active:scale-95 bloom-shadow transition-all hover:brightness-110 cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : currentItem ? (
            /* Active Card in Carousel */
            <div
              key={currentItem.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-start ${
                slideDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right'
              }`}
            >
              
              {/* Left Column: Current Library Entry */}
              <div className="md:col-span-5 bg-surface-container/60 border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                    Current Entry
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-outline-variant/20 text-primary">
                    {getTypeLabel(currentItem.type)}
                  </span>
                </div>

                <div className="flex gap-4">
                  {/* Cover Preview / Fallback */}
                  <div className="w-24 h-36 shrink-0 rounded-lg overflow-hidden border border-outline-variant/20 bg-background flex items-center justify-center bloom-shadow">
                    {currentItem.resolvedCoverUrl || currentItem.coverImagePath ? (
                      <img
                        src={currentItem.resolvedCoverUrl || currentItem.coverImagePath || ''}
                        alt={currentItem.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-text-muted/40">
                        image
                      </span>
                    )}
                  </div>

                  {/* Basic Metadata */}
                  <div className="flex flex-col justify-between overflow-hidden">
                    <div>
                      <h4 className="text-base font-extrabold text-text-high leading-snug line-clamp-3">
                        {currentItem.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-semibold text-text-muted">
                          Status: <span className="text-text-base">{formatStatusLabel(currentItem.status)}</span>
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-text-muted mt-0.5">
                        Progress: <span className="text-text-base">{currentItem.progress} / {currentItem.totalProgress ?? '?'}</span>
                      </div>
                      {currentItem.score && (
                        <div className="flex items-center gap-1 mt-1 text-warning text-xs font-bold">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>{currentItem.score}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recorded Sessions Context */}
                <div className="mt-1 pt-3 border-t border-outline-variant/10">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted block mb-1.5">
                    Recorded Sessions ({currentItem.sessions.length})
                  </span>
                  {currentItem.sessions.length > 0 ? (
                    <div className="space-y-1 max-h-24 min-h-[44px] overflow-y-auto pr-1">
                      {currentItem.sessions.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-background/50 border border-outline-variant/5"
                        >
                          <span className="font-semibold text-text-base">
                            Run #{s.sessionNumber} {s.isActive && <span className="text-primary font-bold">(Active)</span>}
                          </span>
                          <span className="text-text-muted">
                            {s.startDate ? s.startDate.split('T')[0] : '—'} → {s.finishDate ? s.finishDate.split('T')[0] : (s.isActive ? 'Now' : '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[44px] flex items-center">
                      <p className="text-[11px] text-text-muted italic">
                        No consumption dates recorded.
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Indicator & Entry Action */}
                {currentItem.resolutionStatus === 'linked' ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/15 border border-secondary/30 text-secondary text-xs font-semibold">
                    <span className="material-symbols-outlined text-[18px] shrink-0">verified</span>
                    <span className="truncate">Linked to: {currentItem.resolvedResultTitle}</span>
                  </div>
                ) : currentItem.resolutionStatus === 'ignored' ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-outline-variant/30 text-text-muted text-xs">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">check_circle</span>
                    <span>Designated as custom entry.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-[11px]">
                      <span className="material-symbols-outlined text-[16px] shrink-0">info</span>
                      <span>Missing official poster and synchronized metadata.</span>
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={handleKeepAsCustom}
                      className="w-full py-2 px-3 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant/25 hover:border-primary/40 text-text-high hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Keep this specific entry as custom without external metadata"
                    >
                      <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
                      <span>Keep as Custom Entry</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={handleDeleteUnlinkedItem}
                      className="w-full py-2 px-3 rounded-lg bg-error/10 hover:bg-error/20 border border-error/25 hover:border-error/50 text-error transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Completely remove this unlinked entry from your library"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Delete Unlinked Entry</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Provider Search & Suggestions */}
              <div className="md:col-span-7 flex flex-col gap-3">

                {/* Local Library Matches Alert & Action Box */}
                {currentItem.possibleLocalMatches && currentItem.possibleLocalMatches.length > 0 && currentItem.resolutionStatus === 'pending' && (
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-3.5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 mb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        <span>Existing Linked Match Detected in Your Library</span>
                      </div>
                      <span className="text-[10px] font-semibold text-text-muted">
                        {currentItem.possibleLocalMatches.length} match{currentItem.possibleLocalMatches.length > 1 ? 'es' : ''} found
                      </span>
                    </div>

                    {currentItem.possibleLocalMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-surface/80 border border-primary/20 bloom-shadow"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-12 shrink-0 rounded bg-background overflow-hidden border border-outline-variant/15 flex items-center justify-center">
                            {match.coverImagePath ? (
                              <img src={match.coverImagePath} alt={match.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-sm text-text-muted">image</span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-extrabold text-text-high truncate">{match.title}</h5>
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                {match.sourceApi}
                              </span>
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-2">
                              <span>Status: <strong className="text-text-base">{formatStatusLabel(match.status)}</strong></span>
                              <span>•</span>
                              <span>Progress: <strong className="text-text-base">{match.progress} / {match.totalProgress ?? '?'}</strong></span>
                              {match.score && (
                                <>
                                  <span>•</span>
                                  <span className="text-warning font-bold">★ {match.score}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleMergeWithLocal(match)}
                            className="px-3 py-1.5 bg-primary text-on-primary hover:brightness-110 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50 bloom-shadow"
                            title="Merge progress and consumption dates into this linked item"
                          >
                            <span className="material-symbols-outlined text-[15px]">call_merge</span>
                            <span>Merge</span>
                          </button>
                          <button
                            onClick={() => handleDismissLocalMatch(match.id)}
                            className="p-1.5 text-text-muted hover:text-text-high transition-colors"
                            title="Dismiss suggestion"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                    Find Official Metadata
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {searchType === 'ALL' ? (
                      <span className="text-secondary font-bold">Searching across all providers</span>
                    ) : (
                      <span>
                        Limiting to <strong className="text-text-high">{searchType.toLowerCase()}</strong> providers
                      </span>
                    )}
                  </span>
                </div>

                {/* Filter Pills for Unlimited vs Specific Provider Type */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-0.5">
                    Filter:
                  </span>
                  {SEARCH_TYPE_OPTIONS.map((opt) => {
                    const isActive = searchType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleTypeSelect(opt.value)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                            : 'bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-text-high border border-outline-variant/15'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search Input Bar */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleQueryChange}
                    placeholder={searchType === 'ALL' ? 'Search without limitations...' : `Search for ${searchType.toLowerCase()}...`}
                    className="w-full bg-surface-container border border-outline-variant/30 text-text-high text-xs pl-9 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  )}
                </div>

                {/* Results List */}
                <div className="space-y-2 h-[290px] max-h-[290px] overflow-y-auto pr-1">
                  {isSearching ? (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-container/30 border border-outline-variant/10 animate-pulse"
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="w-10 h-14 shrink-0 rounded bg-surface-container-high/60" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 bg-surface-container-high/60 rounded w-3/5" />
                              <div className="h-2.5 bg-surface-container-high/40 rounded w-2/5" />
                            </div>
                          </div>
                          <div className="w-20 h-7 bg-surface-container-high/40 rounded-lg shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 bg-surface-container/40 rounded-xl border border-dashed border-outline-variant/20">
                      <span className="material-symbols-outlined text-3xl text-text-muted/40 mb-2">search_off</span>
                      <p className="text-xs font-semibold text-text-high">No matching titles found</p>
                      <p className="text-[11px] text-text-muted mt-1">
                        Try modifying the search query above or switching the filter.
                      </p>
                    </div>
                  ) : (
                    searchResults.map((res: any) => (
                      <div
                        key={`${res.sourceApi}-${res.externalId}`}
                        className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/15 hover:border-primary/40 transition-all bloom-shadow animate-in fade-in duration-200"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {/* Thumbnail */}
                          <div className="w-10 h-14 shrink-0 rounded bg-background overflow-hidden border border-outline-variant/10 flex items-center justify-center">
                            {res.coverImageUrl ? (
                              <img
                                src={res.coverImageUrl}
                                alt={res.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-sm text-text-muted">image</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-bold text-text-high truncate group-hover:text-primary transition-colors">
                              {res.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-outline-variant/20 text-text-muted">
                                {res.sourceApi}
                              </span>
                              {res.releaseDate && (
                                <span className="text-[10px] text-text-muted">
                                  {res.releaseDate.substring(0, 4)}
                                </span>
                              )}
                              {res.communityScore !== undefined && res.communityScore !== null && (
                                <span className="text-[10px] text-warning flex items-center gap-0.5 font-bold">
                                  ★ {res.communityScore.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 1-Click Link Button */}
                        <button
                          disabled={isProcessing}
                          onClick={() => handleLink(res)}
                          className="shrink-0 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary border border-primary/30 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[15px]">link</span>
                          <span>{currentItem.resolutionStatus === 'linked' ? 'Re-link' : 'Link & Update'}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer Navigation & Actions */}
        {totalCount > 0 && !allResolved && currentItem && (
          <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left Carousel Navigation */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0 || isProcessing}
                className="px-3 py-2 bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high disabled:opacity-40 text-text-high text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Previous</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === totalCount - 1 || isProcessing}
                className="px-3 py-2 bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high disabled:opacity-40 text-text-high text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Skip</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* Right Action: Finish / Exit */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-secondary text-[#003822] text-xs font-bold rounded-xl active:scale-95 bloom-shadow transition-all hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                title="Finish reviewing and return to library"
              >
                <span className="material-symbols-outlined text-[17px]">done_all</span>
                <span>Finish</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Entry Deletion */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Unlinked Entry?"
        message={`Are you sure you want to permanently delete "${currentItem?.title || 'this item'}" from your library? All recorded sessions and progress for this entry will be removed.`}
        confirmLabel="Delete Entry"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDeleteUnlinkedItem}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {/* Confirmation Modal for Entry Merge */}
      <ConfirmationModal
        isOpen={pendingMergeMatch !== null}
        title="Merge Media Entries?"
        message={`Are you sure you want to merge "${currentItem?.title || 'this unlinked entry'}" into your existing library entry "${pendingMergeMatch?.title}"? All consumption dates, sessions, and tracking history will be combined into "${pendingMergeMatch?.title}".`}
        confirmLabel="Merge Entries"
        cancelLabel="Cancel"
        type="info"
        onConfirm={confirmMergeWithLocal}
        onCancel={() => setPendingMergeMatch(null)}
      />

      {/* Interactive Conflict Resolution Modal for Field Discrepancies */}
      {conflictMatchTarget && currentItem && (
        <MergeConflictModal
          isOpen={conflictMatchTarget !== null}
          onClose={() => setConflictMatchTarget(null)}
          unlinkedItem={currentItem}
          targetMatch={conflictMatchTarget}
          onConfirmMerge={confirmMergeWithOverrides}
        />
      )}
    </div>
  );
};
