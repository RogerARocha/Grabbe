import { useNavigate } from 'react-router-dom';
import { MediaCard } from '../shared/MediaCard';

/**
 * Displays a dashboard widget of up to 4 items the user is currently consuming,
 * calculating and presenting their progress percentages.
 */
export const CurrentlyConsuming = ({ items = [] }: { items?: any[] }) => {
  const navigate = useNavigate();

  const consumingItems = items.filter(i => i.status === 'CONSUMING').slice(0, 4);

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-high">Currently Consuming</h2>
        <a className="text-sm font-bold text-primary hover:text-tertiary transition-colors" href="/library">View All Session</a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {consumingItems.map(item => {
          const current = item.progress ?? item.currentProgress ?? 0;
          const total = item.total_progress ?? item.totalProgress ?? item.totalProgressUnits;

          const effectiveTotal = total && total > 0 ? total : 1;
          const percent = Math.min(Math.round((current / effectiveTotal) * 100), 100);
          
          return (
            <MediaCard 
              key={item.id} 
              variant="dashboard" 
              title={item.title} 
              image={item.cover_image_path ?? item.coverImageUrl} 
              
              subtitle={item.type} 
              currentProgress={current} 
              totalProgress={total}
              
              percent={percent} 
              onClick={() => navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`, { state: { from: 'Dashboard', path: '/' } })}
            />
          );
        })}
        {consumingItems.length === 0 && (
          <div className="col-span-4 py-8 text-center text-text-muted">
            You are not consuming anything at the moment.
          </div>
        )}
      </div>
    </section>
  );
};