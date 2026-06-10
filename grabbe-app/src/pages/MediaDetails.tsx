import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { apiFetch } from '../lib/httpClient';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { EvaluationModal } from '../components/modals/EvaluationModal';
import { HeroCover } from '../components/media-details/HeroCover';
import { ProgressTracker } from '../components/media-details/ProgressTracker';
import { MediaHeader } from '../components/media-details/MediaHeader';
import { ActionBar } from '../components/media-details/ActionBar';
import { DetailsGrid } from '../components/media-details/DetailsGrid';
import { CastSection } from '../components/media-details/CastSection';
import { AlternativeTitles } from '../components/media-details/AlternativeTitles';
import { getMediaByExternalId, upsertMedia } from '../lib/db';
import { ConsumptionTimeline } from '../components/media-details/ConsumptionTimeline';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { useMediaSearch } from '../hooks/useMediaSearch';
import { useMediaTracking } from '../hooks/useMediaTracking';
import { getPublisherLabel, getTypeLabel } from '../lib/mediaUtils';
import { MetadataLinker } from '../components/media-details/MetadataLinker';

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

  const [media, setMedia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const {
    searchQuery,
    searchResults,
    isSearching,
    showDropdown,
    setShowDropdown,
    handleQueryChange
  } = useMediaSearch(type || media?.type);

  const {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    isInLibrary,
    tracking,
    setTracking,
    confirmConfig,
    setConfirmConfig,
    handleAddClick,
    handleUpdateClick,
    handleRemoveClick,
    handleRewatchClick,
    handleQuickProgress,
    handleSelectResult,
    handleUnlink
  } = useMediaTracking({
    externalId,
    sourceApi,
    type,
    showToast,
    navigate
  });

  const [lastExternalId, setLastExternalId] = useState<string | null>(null);

  useEffect(() => {
    if (!externalId || !sourceApi || !type) return;

    let active = true;
    if (externalId !== lastExternalId) {
      setIsLoading(true);
      setLastExternalId(externalId);
    }

    async function loadMedia() {
      try {
        // 1. Try to load from local SQLite first
        const localMedia = await getMediaByExternalId(externalId!, sourceApi!);
        if (localMedia && active) {
          console.log('Loaded media details local-first:', localMedia);
          setMedia(localMedia);
          setTracking((prev: any) => ({ ...prev, totalProgress: localMedia.totalProgressUnits || 0 }));
          
          // Check if this is a real external media (not a dummy import) and is missing rich details
          const isPlaceholder = externalId?.startsWith('imported_') ?? false;
          const isMissingRichDetails = !localMedia.description || 
                                       !localMedia.releaseYear || 
                                       !localMedia.publisherOrStudio || 
                                       (!localMedia.keyPeople || localMedia.keyPeople.length === 0);

          if (!isPlaceholder && isMissingRichDetails) {
            console.log('Local media is missing rich details, fetching from BFF in background to enrich...');
            if (externalId !== lastExternalId) {
              setIsLoading(false);
            }
            
            try {
              const res = await apiFetch(`/api/v1/media/${sourceApi}/${type}/${externalId}`);
              if (res.ok) {
                const body = await res.json();
                if (body.data && active) {
                  console.log('Background enrichment fetched successfully:', body.data);
                  const enriched = {
                    ...body.data,
                    id: localMedia.id,
                    formattedConsumptionMetric: localMedia.formattedConsumptionMetric
                  };
                  setMedia(enriched);
                  setTracking((prev: any) => ({ ...prev, totalProgress: enriched.totalProgressUnits || 0 }));
                  await upsertMedia(enriched);
                }
              }
            } catch (enrichErr) {
              console.warn('Background enrichment failed:', enrichErr);
            }
          } else {
            setIsLoading(false);
          }
          return;
        }
      } catch (dbErr) {
        console.warn('Failed to load local media details from DB, falling back to BFF:', dbErr);
      }

      if (!active) return;

      // 2. If not found locally, fetch from BFF
      try {
        const res = await apiFetch(`/api/v1/media/${sourceApi}/${type}/${externalId}`);
        if (!res.ok) throw new Error('Failed to load from BFF');
        const body = await res.json();
        if (!body.data) throw new Error('Empty data from BFF');
        
        if (active) {
          setMedia(body.data);
          setTracking((prev: any) => ({ ...prev, totalProgress: body.data.totalProgressUnits || 0 }));
          setIsLoading(false);
        }
      } catch (bffErr) {
        console.warn('BFF request failed:', bffErr);
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadMedia();

    return () => {
      active = false;
    };
  }, [externalId, sourceApi, type, isModalOpen]);

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

  let year: number | null = null;
  if (media.releaseYear) {
    year = parseInt(String(media.releaseYear), 10);
  } else if (media.releaseDate) {
    year = parseInt(String(media.releaseDate).split('-')[0], 10);
  }

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
                consumptionMetric={media.formattedConsumptionMetric || media.consumption_metric}
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
              <MetadataLinker
                searchQuery={searchQuery}
                searchResults={searchResults}
                isSearching={isSearching}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                handleQueryChange={handleQueryChange}
                handleSelectResult={handleSelectResult}
              />
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
