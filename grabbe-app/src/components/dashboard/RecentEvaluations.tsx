import { useNavigate } from 'react-router-dom';

/**
 * Dashboard widget showing the latest library items the user has explicitly rated.
 */
export const RecentEvaluations = ({ items = [] }: { items?: any[] }) => {
  const navigate = useNavigate();
  
  const evaluatedItems = items.filter(i => i.score && i.score > 0).slice(0, 2);

  if (evaluatedItems.length === 0) return null;

  const item1 = evaluatedItems[0];
  const item2 = evaluatedItems.length > 1 ? evaluatedItems[1] : null;

  const getScoreLabel = (score: number) => {
    if (score === 10) return "Masterpiece";
    if (score >= 8) return "Great";
    if (score >= 6) return "Good";
    if (score >= 4) return "Average";
    return "Poor";
  };

  const getScoreColor = (score: number) => {
    if (score === 10) return "prismatic-text";
    if (score >= 8) return "text-primary";
    if (score >= 6) return "text-secondary";
    if (score >= 4) return "text-warning";
    return "text-error";
  };

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-high">Recent Evaluations</h2>
        <div className="flex gap-2">
          {/* TODO: Implement actual type filtering, currently a static badge */}
          <span className="bg-surface px-3 py-1 rounded-full text-[10px] font-bold text-text-high border border-outline-variant/20">All Types</span>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {item1 && (
          <div 
            onClick={() => navigate(`/media/${item1.external_id}?source=${item1.source_api}&type=${item1.type}`, { state: { from: 'Dashboard', path: '/' } })}
            className={`col-span-12 ${item2 ? 'md:col-span-8' : 'md:col-span-12'} bg-surface rounded-xl overflow-hidden bloom-shadow group border border-outline-variant/20 cursor-pointer`}
          >
            <div className="flex flex-col md:flex-row h-full">
              <div className="md:w-1/2 overflow-hidden h-full bg-surface-container-high">
                {item1.cover_image_path ? (
                  <img 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    alt={item1.title} 
                    src={item1.cover_image_path}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                    <span className="material-symbols-outlined text-text-muted text-4xl">image</span>
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-1 bg-tertiary/10 text-tertiary rounded uppercase">{item1.type}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 bg-secondary/10 text-secondary rounded uppercase`}>{getScoreLabel(item1.score)}</span>
                </div>
                <h3 className={`text-3xl font-black mb-4 leading-none ${getScoreColor(item1.score)} line-clamp-2`}>{item1.title}</h3>
                <p className="text-text-muted text-sm mb-6 line-clamp-3 italic">
                  {item1.review_text ? `"${item1.review_text}"` : "No review written for this item yet."}
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-text-high">{item1.score}/10</span>
                    <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Evaluation</span>
                  </div>
                  <button className="ml-auto flex items-center gap-2 text-xs font-bold group-hover:text-primary transition-colors text-text-high">
                    View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {item2 && (
          <div 
            onClick={() => navigate(`/media/${item2.external_id}?source=${item2.source_api}&type=${item2.type}`, { state: { from: 'Dashboard', path: '/' } })}
            className="col-span-12 md:col-span-4 bg-surface rounded-xl p-6 bloom-shadow border border-outline-variant/20 cursor-pointer group hover:border-primary/30 transition-colors flex flex-col"
          >
            <div className="mb-4 aspect-video rounded-lg overflow-hidden bg-surface-container-high shrink-0">
              {item2.cover_image_path ? (
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={item2.title} 
                  src={item2.cover_image_path}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-text-muted text-2xl">image</span>
                </div>
              )}
            </div>
            <h4 className="font-bold mb-2 text-text-high line-clamp-1 shrink-0">{item2.title}</h4>
            <p className="text-[12px] text-text-muted mb-4 line-clamp-2 italic">
              {item2.notes ? `"${item2.notes}"` : "No review written yet."}
            </p>
            <div className="flex items-center justify-between mt-auto shrink-0">
              <span className={`text-lg font-bold ${getScoreColor(item2.score)}`}>{item2.score}/10</span>
              <span className="text-[10px] font-bold text-text-muted">{item2.type}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
