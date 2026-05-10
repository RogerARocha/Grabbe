import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import { getTrackingByExternalId, removeTrackingByExternalId, saveTracking, startRewatch } from '../lib/db';
import { ConsumptionTimeline } from '../components/media-details/ConsumptionTimeline';

/**
 * Detailed view for a specific media item. 
 * Combines data fetched from the external API (TMDB/Jikan) with local tracking state.
 */
export const MediaDetails = () => {
  const { id: externalId } = useParams();
  const [searchParams] = useSearchParams();
  const sourceApi = searchParams.get('source');
  const type = searchParams.get('type');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'update'>('add');
  const [media, setMedia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      .then(res => res.json())
      .then(res => {
        setMedia(res.data);
        setTracking((prev: any) => ({ ...prev, totalProgress: res.data.totalProgressUnits || 0 }));
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch media details', err);
        setIsLoading(false);
      });
  }, [externalId, sourceApi, type]);

  useEffect(() => {
    refreshTracking();
  }, [externalId, sourceApi, isModalOpen]);

  if (isLoading) return <MainLayout><div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div></MainLayout>;
  if (!media) return <MainLayout><div className="flex items-center justify-center min-h-[50vh] text-text-muted">Failed to load media</div></MainLayout>;

  const extras = {
    runtime: media.formattedConsumptionMetric,
    externalRating: media.communityScore,
    ratingSource: sourceApi ?? undefined,
    studio: media.publisherOrStudio,
    originalLanguage: media.originalLanguage,
    alternativeTitles: media.alternativeTitles || [],
    cast: media.keyPeople || []
  };

  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null;

  const handleAddClick = () => {
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleUpdateClick = () => {
    setModalMode('update');
    setIsModalOpen(true);
  };

  const handleRemoveClick = async () => {
    if (window.confirm('Are you sure you want to remove this from your library?')) {
      if (externalId && sourceApi) {
        await removeTrackingByExternalId(externalId, sourceApi);
        refreshTracking();
      }
    }
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

    const effectiveTotal = media.type === 'MOVIE' ? 1 : (tracking.totalProgress || 0);
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

  const detailItems = [
    { label: 'Studio', value: extras.studio },
    { label: 'Original Language', value: extras.originalLanguage },
    ...(media.type ? [{ label: 'Type', value: media.type === 'SERIES' ? 'TV Series' : 'Film' }] : []),
    ...(media.releaseDate ? [{ label: 'Release', value: media.releaseDate }] : []),
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Library', path: '/library' },
          { label: media.type === 'SERIES' ? 'Series' : 'Movies' },
          { label: media.title },
        ]} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            <HeroCover title={media.title} imageUrl={media.coverImageUrl ?? ''} />
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

            {media.description && (
              <div className="max-w-2xl">
                <p className="text-lg text-text-base leading-relaxed font-light opacity-90">{media.description}</p>
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
    </MainLayout>
  );
};
