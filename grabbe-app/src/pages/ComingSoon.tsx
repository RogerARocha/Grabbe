import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { FEATURE_MAP } from '../components/comming-soon/data';
import { FloatingBackground } from '../components/comming-soon/FloatingBackground';
import { FeatureContent } from '../components/comming-soon/FeatureContent';

interface ComingSoonProps {
  feature?: string;
}

export function ComingSoon({ feature = 'analytics' }: ComingSoonProps) {
  const navigate = useNavigate();
  const config = FEATURE_MAP[feature] ?? FEATURE_MAP['analytics'];

  return (
    <MainLayout>
      <FloatingBackground />

      <div className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-20">
        
        {/* Back Button */}
        <div className="absolute top-0 left-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text-high transition-colors active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span className="text-sm font-semibold">Go back</span>
          </button>
        </div>

        {/* Core Content */}
        <FeatureContent config={config} />

        <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent my-10" />

        {/* Call to Action Buttons */}
        <div className="flex items-center gap-4 w-full justify-center flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-bold rounded-lg primary-glow active:scale-95 transition-all hover:brightness-110"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/library')}
            className="flex items-center gap-2 px-8 py-3 bg-surface text-text-muted font-bold rounded-lg border border-outline-variant/20 hover:text-text-high hover:border-outline-variant/40 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">movie_filter</span>
            My Library
          </button>
        </div>
      </div>
    </MainLayout>
  );
}