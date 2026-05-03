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
import { getTrackingByExternalId, removeTrackingByExternalId, saveTracking } from '../lib/db';

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
    userScore: undefined
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
        userScore: data.score
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

  // Temporarily map API response to UI variables
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

  const handleQuickProgress = async () => {
    if (!isInLibrary || !tracking) return;
    const newProgress = (tracking.currentProgress || 0) + 1;
    if (tracking.totalProgress && newProgress > tracking.totalProgress) return;

    // We need the internal mediaId. refreshTracking data has it.
    const data = await getTrackingByExternalId(externalId!, sourceApi!);
    if (data) {
      await saveTracking(data.media_id, data.status, data.score, newProgress, data.total_progress, data.notes);
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
          {/* Left Column */}
          <div className="md:col-span-5 lg:col-span-4">
            <HeroCover title={media.title} imageUrl={media.coverImageUrl ?? ''} />
            {isInLibrary && tracking.status === 'CONSUMING' && (
              <ProgressTracker
                currentProgress={tracking.currentProgress}
                totalProgress={tracking.totalProgress}
                label={tracking.progressLabel}
                onUpdate={handleQuickProgress}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-8">
            <MediaHeader
              title={media.title}
              genres={media.genres}
              year={year}
              runtime={extras.runtime}
              externalRating={extras.externalRating}
              ratingSource={extras.ratingSource}
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
              onAdd={handleAddClick}
              onUpdate={handleUpdateClick}
              onRemove={handleRemoveClick}
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
      />
    </MainLayout>
  );
};
