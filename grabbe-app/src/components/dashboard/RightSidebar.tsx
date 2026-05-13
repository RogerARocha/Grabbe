import { useNavigate } from 'react-router-dom';

export const RightSidebar = ({ items = [] }: { items?: any[] }) => {
  const navigate = useNavigate();
  const plannedItems = items.filter(i => i.status === 'PLANNED').slice(0, 3);

  return (
    <aside className="col-span-12 lg:col-span-3 space-y-8">
      {/* Planned Next */}
      <section className="bg-surface rounded-xl p-6 bloom-shadow border border-outline-variant/20">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-high">
          <span className="material-symbols-outlined text-primary">bookmark</span>
          Planned Next
        </h2>
        
        {plannedItems.length > 0 ? (
          <div className="space-y-6">
            {plannedItems.map(item => (
              <div 
                key={item.id} 
                className="flex gap-4 group cursor-pointer"
                onClick={() => navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`, { state: { from: 'Dashboard', path: '/dashboard' } })}
              >
                <div className="w-12 h-16 bg-surface-container-high rounded overflow-hidden shrink-0">
                  {item.cover_image_path ? (
                    <img 
                      className="w-full h-full object-cover" 
                      alt={item.title} 
                      src={item.cover_image_path}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background">
                      <span className="material-symbols-outlined text-text-muted text-sm">image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold group-hover:text-primary transition-colors text-text-high line-clamp-2">{item.title}</h4>
                  <p className="text-[10px] text-text-muted uppercase mt-1">{item.type} {item.release_date ? `• ${String(item.release_date).substring(0, 4)}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">No planned items.</p>
        )}
        
        <button 
          onClick={() => navigate('/library?filter=PLANNED')}
          className="w-full mt-8 py-2 bg-surface-container-high rounded-lg text-[11px] font-bold text-primary hover:bg-surface-container-highest transition-colors"
        >
          Manage Watchlist
        </button>
      </section>

      {/* Community Pulse */}
      <section className="bg-gradient-to-br from-tertiary/20 to-primary/10 rounded-xl p-6 border border-on-tertiary-container/10">
        <h2 className="text-lg font-black mb-4 italic tracking-tighter text-text-high">Community Pulse</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <div>
              <p className="text-[12px] font-bold text-text-high">"Visions" is trending</p>
              <p className="text-[10px] text-text-muted">1.4k new evaluations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <div>
              <p className="text-[12px] font-bold text-text-high">Director AMA live</p>
              <p className="text-[10px] text-text-muted">Starts in 2 hours</p>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
};
