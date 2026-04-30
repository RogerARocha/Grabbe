import { useState } from 'react';
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

const mockMedia = {
  externalId: '157336',
  sourceApi: 'TMDB',
  type: 'MOVIE',
  title: 'Interstellar',
  description:
    'When Earth becomes uninhabitable, a team of ex-pilots and scientists travel through a wormhole in search of a new home for humanity. A masterful exploration of time, love, and the vast loneliness of the cosmos.',
  coverImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmiqtswy7UYHEQsfPpvrOtzVF91krHEHOq29RDtVs7sgOQLwQkCQ24eoRaN3S4V7eF6PZE79pRiMgObFSSvQhiVcAX4OCBcBdGVF3-rG0t9kymOhdTr5vPea0Fsdmb2ZwyR-yQBqdlpOAutIEpdWvnecXpMx25J7nzUwRNiYWQzDTsW4mpiEFm0Qer7EXhQJyu3pVmee7eSmkKQqhuJbC8A_4kzqpC8P3I5DQXB7HoHSynu0_0mDiGa9Uk5uc7LdXphEoh1TdvjPLW',
  releaseDate: '2014-11-07',
  genres: ['Sci-Fi', 'Adventure', 'Drama'],
  totalProgress: null,
};

const mockExtras = {
  runtime: '2h 49m',
  externalRating: 9.4,
  ratingSource: 'IMDB',
  studio: 'Legendary Pictures',
  originalLanguage: 'English',
  alternativeTitles: ['Interestelar', 'Interstellar: The IMAX Experience'],
  cast: [
    { name: 'Christopher Nolan', role: 'Director', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYfUv4P2691j0T9R3A_Cq-7j0C29v_f5p92l5V_53-l-nS7S4-n5m-8O-l' },
    { name: 'M. McConaughey', role: 'Cooper', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU945A2-4dIcVh2JfvTYAVnLWbzXusF90ey-oYWWwP6RmC7IFzQ8w6bsH_T18EDF5pwuJhcXhwa4vp0YY-AJm7sfOqTqItua7g5TMtFd7rbTtMZSzN9zTWm4T_NUV0t4dLwjgFZmD5Bta0AemLRGWMpZsLFYyP7v-LnZhx5r4qASOexbpkCUUX4mlmYK-AVU9T8tUyXyf_HYx5WAU7knsSg5rTSkZ_VNMkMnKlxnEQbLxRimIj-sES7JuCpf90kRGPN38MsNrn6Oom' },
    { name: 'Anne Hathaway', role: 'Brand', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYbtmvC3y3ZNGpvVFUqel-q_U3kgsY30v0C1S7hu_ko342Ap4B2ky9TNEJqDzCyC5xwNAD9otP62XH4H2YFJCiv8AGNV6t7lzIq583MnYuRmXDZyuiUgLcR7rn1872xJVQZQXcpAoKsuGH5q-6nByES9p6LdiFdr5QtzHg9vrO9o-rC7uS3fkFE7PCdZVXDweACO-3jbpO86U4mF61sCx_uDxPHcBmTOLypgtkCJeL9nt585rdrjUShM78Yfhh96-8xg9ogAnn0g07' },
    { name: 'Jessica Chastain', role: 'Murph', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmf5iovAasiUtztfP5tvInG9vFfNGydAB3CXYMMJrdmFNUoBEGQjqdLzAbn5gz9TErCV0RzK1eiSS2HyaSw6pPM11wli9xdipg7f1ulc5qQq02XQRowUoSWg0IAeMdj4vPqKvLQgITwTYVQChRLkmMakHl8zwmkqbc1BAnC2DIvOrF22c0h42NJbs7NhhJCIgf_Bjio7wg3dpEVbJzSR98vQo6_ChE9xKSgPyvq6Ucl1KEYZk4agXVRmtSDG6C-7_0_BXdkKntdHM1' },
  ],
};

const mockTracking = {
  status: 'CONSUMING' as const,
  currentProgress: 92,
  totalProgress: 110,
  progressLabel: '92 mins of 110 mins',
  userScore: 9.5,
};

export const MediaDetails = () => {
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'update'>('add');

  const media = mockMedia;
  const extras = mockExtras;
  const tracking = mockTracking;
  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null;

  const handleAddClick = () => {
    setModalMode('add');
    setIsModalOpen(true);
    setIsInLibrary(true);
  };

  const handleUpdateClick = () => {
    setModalMode('update');
    setIsModalOpen(true);
  };

  const handleRemoveClick = () => {
    if (window.confirm('Are you sure you want to remove this from your library?')) {
      setIsInLibrary(false);
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
      />
    </MainLayout>
  );
};
