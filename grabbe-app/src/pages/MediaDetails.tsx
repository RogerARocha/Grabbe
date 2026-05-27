import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { EvaluationModal } from '../components/modals/EvaluationModal';
import { HeroCover } from '../components/media-details/HeroCover';
import { ProgressTracker } from '../components/media-details/ProgressTracker';
import { MediaHeader } from '../components/media-details/MediaHeader';
import { ActionBar } from '../components/media-details/ActionBar';
import { DetailsGrid } from '../components/media-details/DetailsGrid';
import { CastSection } from '../components/media-details/CastSection';
import { AlternativeTitles } from '../components/media-details/AlternativeTitles';
import { getTrackingByExternalId, removeTrackingByExternalId, saveTracking, startRewatch, getMediaByExternalId, linkMediaToRealId, unlinkMedia } from '../lib/db';
import { ConsumptionTimeline } from '../components/media-details/ConsumptionTimeline';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';

const getPublisherLabel = (type?: string) => {
  switch (type) {
    case 'BOOK':
    case 'MANGA':
      return 'Publisher';
    case 'GAME':
      return 'Developer / Publisher';
    case 'SERIES':
      return 'Network';
    case 'ANIME':
    case 'MOVIE':
    default:
      return 'Studio';
  }
};

const getTypeLabel = (type?: string) => {
  switch (type) {
    case 'SERIES': return 'TV Series';
    case 'MOVIE': return 'Film';
    case 'ANIME': return 'Anime';
    case 'MANGA': return 'Manga';
    case 'BOOK': return 'Book';
    case 'GAME': return 'Game';
    default: return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Unknown';
  }
};

/**
 * Detailed view for a specific media item. 
 * Combines data fetched from the external API (TMDB/Jikan) with local tracking state.
 */
export const MediaDetails = () => {
  const { id: externalId } = useParams();
  const [searchParams] = useSearchParams();
  const sourceApi = searchParams.get('source');
  const type = searchParams.get('type');
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'update'>('add');
  const [media, setMedia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    type: 'info',
    onConfirm: () => {}
  });

  const [isInLibrary, setIsInLibrary] = useState(false);
  const [tracking, setTracking] = useState<any>({
    status: 'PLANNED',
    currentProgress: 0,
    totalProgress: 0,
    progressLabel: '',
    userScore: undefined,
    startDate: undefined,
    endDate: undefined,
    reviewText: '',
    rewatchCount: 0,
    trackingId: undefined,
    mediaId: undefined,
    sessions: [],
    historyEvents: []
  });

  const refreshTracking = async () => {
    if (!externalId || !sourceApi) return;
    const data = await getTrackingByExternalId(externalId, sourceApi);
    if (data) {
      setIsInLibrary(true);
      setTracking((prev: any) => ({
        ...prev,
        status: data.status,
        currentProgress: data.progress || 0,
        totalProgress: data.total_progress || prev.totalProgress,
        // Prefer the Ranking.review_text (authoritative) over UserTracking.review_text.
        userScore: data.score,
        reviewText: data.reviewTextFromRanking || data.review_text || '',
        startDate: data.startDate,
        endDate: data.endDate,
        rewatchCount: data.rewatch_count ?? 0,
        trackingId: data.id,
        mediaId: data.media_id,
        sessions: data.sessions || [],
        historyEvents: data.historyEvents || []
      }));
    } else {
      setIsInLibrary(false);
    }
  };

  useEffect(() => {
    if (!externalId || !sourceApi || !type) return;

    setIsLoading(true);
    fetch(`http://localhost:5244/api/v1/media/${sourceApi}/${type}/${externalId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load from BFF');
        return res.json();
      })
      .then(res => {
        if (!res.data) throw new Error('Empty data from BFF');
        setMedia(res.data);
        setTracking((prev: any) => ({ ...prev, totalProgress: res.data.totalProgressUnits || 0 }));
        setIsLoading(false);
      })
      .catch(async err => {
        console.warn('BFF fallback triggered:', err);
        const localMedia = await getMediaByExternalId(externalId, sourceApi);
        if (localMedia) {
          setMedia(localMedia);
        }
        setIsLoading(false);
      });
  }, [externalId, sourceApi, type]);

  useEffect(() => {
    refreshTracking();
  }, [externalId, sourceApi, isModalOpen]);

  const fromLabel = location.state?.from || 'Library';
  const fromPath = location.state?.path || '/library';

  if (isLoading) return <MainLayout><div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div></MainLayout>;
  
  if (!media) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6 border border-error/20 relative group">
            <div className="absolute inset-0 rounded-full bg-error/20 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="material-symbols-outlined text-4xl text-error relative z-10 animate-pulse">
              sentiment_very_dissatisfied
            </span>
          </div>
          
          <h2 className="text-3xl font-black text-text-high tracking-tight mb-3">
            Oops! Content Unavailable
          </h2>
          <p className="text-sm text-text-muted leading-relaxed mb-8">
            We couldn't retrieve the details for this media. The online source API might be temporarily down, or this item may have been removed.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <button
              onClick={() => navigate(fromPath)}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all active:scale-95 hover:brightness-110 bloom-shadow flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to {fromLabel}
            </button>
            <button
              onClick={() => navigate('/discover')}
              className="w-full sm:w-auto px-6 py-3 bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high text-text-high text-sm font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              Discover New
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const extras = {
    runtime: media.formattedConsumptionMetric,
    externalRating: media.communityScore,
    ratingSource: sourceApi ?? undefined,
    studio: media.publisherOrStudio,
    originalLanguage: media.originalLanguage,
    alternativeTitles: media.alternativeTitles || [],
    cast: media.keyPeople || []
  };

  const year = media.releaseDate ? parseInt(media.releaseDate.split('-')[0], 10) : null;

  const handleAddClick = () => {
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleUpdateClick = () => {
    setModalMode('update');
    setIsModalOpen(true);
  };

  const handleRemoveClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove from Library',
      message: 'Are you sure you want to remove this from your library? This will permanently delete all tracking progress, history, and review entries associated with this media.',
      confirmLabel: 'Remove from Library',
      type: 'danger',
      onConfirm: async () => {
        if (externalId && sourceApi) {
          await removeTrackingByExternalId(externalId, sourceApi);
          refreshTracking();
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  /**
   * Initiates a new rewatch/reread/replay session.
   * Archives the evaluation (score + review) into TrackingHistory as SESSION_COMPLETED,
   * clears the live Ranking entry, then opens a fresh ConsumptionSession.
   */
  const handleRewatchClick = async () => {
    if (!tracking.trackingId || !tracking.mediaId) return;
    await startRewatch(tracking.trackingId, tracking.mediaId);
    refreshTracking();
  };

  /**
   * Increments progress. 
   * Automatically transitions status to CONSUMING if starting, or COMPLETED if reaching the end.
   */
  const handleQuickProgress = async () => {
    if (!isInLibrary || !tracking) return;

    const effectiveTotal = tracking.totalProgress || 0;
    const newProgress = (tracking.currentProgress || 0) + 1;
    if (effectiveTotal > 0 && newProgress > effectiveTotal) return;

    const data = await getTrackingByExternalId(externalId!, sourceApi!);
    if (data) {
      let newStatus = data.status;
      let newStartDate = data.startDate;
      let newEndDate = data.endDate;

      if (newStatus === 'PLANNED' || newStatus === 'DROPPED' || newStatus === 'ON HOLD') {
        newStatus = 'CONSUMING';
        if (!newStartDate) {
          newStartDate = new Date().toISOString();
        }
      }

      if (effectiveTotal > 0 && newProgress >= effectiveTotal) {
        newStatus = 'COMPLETED';
        if (!newEndDate) {
          newEndDate = new Date().toISOString();
        }
      }

      await saveTracking(data.media_id, newStatus, data.score, newProgress, data.total_progress, data.review_text, newStartDate, newEndDate);
      refreshTracking();
    }
  };

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
    if (!tracking.mediaId) return;
    setSearchQuery(result.title);
    setShowDropdown(false);
    setIsSearching(true);
    try {
      await linkMediaToRealId(tracking.mediaId, result.externalId, result.sourceApi, result.type, result.title, result.coverImageUrl || null);
      // Replace current URL with new valid URL to refresh the whole page
      navigate(`/media/${result.externalId}?source=${result.sourceApi}&type=${result.type}`, { replace: true });
      window.location.reload(); // Ensure everything is fully refreshed, as the library cache might be stale
    } catch (err) {
      console.error("Link failed", err);
      showToast("Failed to link media. Check console for details.", "error");
      setIsSearching(false);
    }
  };

  const handleUnlink = async () => {
    if (!tracking.mediaId) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Unlink Metadata',
      message: 'Are you sure you want to unlink this media? This will clear the online details and allow you to search and link a different item manually.',
      confirmLabel: 'Unlink Media',
      type: 'danger',
      onConfirm: async () => {
        try {
          const newExternalId = await unlinkMedia(tracking.mediaId!);
          navigate(`/media/${newExternalId}?source=${sourceApi}&type=${media.type}`, { replace: true });
          window.location.reload();
        } catch (err) {
          console.error("Unlink failed", err);
          showToast("Failed to unlink media.", "error");
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const detailItems = [
    ...(extras.studio ? [{ label: getPublisherLabel(media.type), value: extras.studio }] : []),
    ...(extras.originalLanguage ? [{ label: 'Original Language', value: extras.originalLanguage }] : []),
    ...(media.type ? [{ label: 'Type', value: getTypeLabel(media.type) }] : []),
    ...(media.releaseDate ? [{ label: 'Release', value: media.releaseDate }] : []),
  ];


  
  const isBasicImport = !media.coverImageUrl || externalId?.startsWith('imported_');

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[
          { label: fromLabel, path: fromPath },
          { label: media.title },
        ]} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            {isBasicImport ? (
              <div className="aspect-2/3 rounded-lg overflow-hidden bloom-shadow transition-all duration-300 bg-surface-elevated flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-text-muted opacity-30">image</span>
              </div>
            ) : (
              <HeroCover title={media.title} imageUrl={media.coverImageUrl ?? ''} />
            )}
            {isInLibrary && (
              <ProgressTracker
                currentProgress={tracking.currentProgress}
                totalProgress={tracking.totalProgress}
                label={tracking.progressLabel}
                mediaType={media.type}
                onUpdate={handleQuickProgress}
              />
            )}
            {isInLibrary && tracking.sessions.length > 0 && (
              <div className="p-5 bg-surface-container rounded-xl border border-outline-variant/10 bloom-shadow">
                <ConsumptionTimeline
                  sessions={tracking.sessions}
                  historyEvents={tracking.historyEvents}
                  activeReviewText={tracking.reviewText}
                  activeScore={tracking.userScore}
                  mediaType={media.type}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-8">
            <MediaHeader
              title={media.title}
              genres={media.genres}
              year={year}
              runtime={extras.runtime}
              externalRating={extras.externalRating}
              ratingSource={extras.ratingSource}
              rewatchCount={isInLibrary ? tracking.rewatchCount : undefined}
              mediaType={media.type}
            />

            {media.description && !isBasicImport && (
              <div className="max-w-2xl">
                <p className="selectable-text text-lg text-text-base leading-relaxed font-light opacity-90">{media.description}</p>
              </div>
            )}
            
            {isBasicImport && (
              <div className="max-w-2xl p-5 border border-sky-500/30 bg-sky-500/10 rounded-xl flex flex-col gap-4">
                <p className="text-sm text-text-base font-medium leading-relaxed">
                  We not finded the details online (poster, synopsis) for this media. You can try to search and link it manually later. If you can't find it, don't worry: your data, notes and progress are already saved securely.
                </p>
                <div className="flex flex-col gap-2 relative">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sky-400">search</span>
                    <input
                      type="text"
                      placeholder="Search by title to link..."
                      className="w-full bg-background border border-sky-500/30 text-text-high text-sm pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                      value={searchQuery}
                      onChange={handleQueryChange}
                      onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                    />
                    {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />}
                  </div>
                  
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-surface rounded-lg border border-outline-variant/30 overflow-hidden z-50 max-h-60 overflow-y-auto bloom-shadow">
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
              </div>
            )}

            <ActionBar
              isInLibrary={isInLibrary}
              status={tracking.status}
              userScore={tracking.userScore}
              mediaType={media.type}
              onAdd={handleAddClick}
              onUpdate={handleUpdateClick}
              onRemove={handleRemoveClick}
              onRewatch={handleRewatchClick}
            />

            <DetailsGrid items={detailItems} />
            <CastSection cast={extras.cast} />
            <AlternativeTitles titles={extras.alternativeTitles} />

            {isInLibrary && !isBasicImport && (
              <div className="pt-8 flex justify-end">
                <button 
                  onClick={handleUnlink}
                  className="text-xs font-bold text-text-muted hover:text-warning transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[14px]">link_off</span>
                  Incorrect metadata? Unlink this media
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialMediaName={media.title}
        media={media}
        initialStatus={tracking.status}
        initialScore={tracking.userScore}
        initialProgress={tracking.currentProgress}
        initialStartDate={tracking.startDate}
        initialEndDate={tracking.endDate}
        initialReviewText={tracking.reviewText}
      />
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </MainLayout>
  );
};
