import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MediaCard } from '../shared/MediaCard';
import { getLibraryItems } from '../../lib/db';

export const CurrentlyConsuming = () => {
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  const loadItems = () => {
    getLibraryItems().then((all) => {
      if (all) {
        setItems(all.filter(i => i.status === 'CONSUMING').slice(0, 4));
      }
    });
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-high">Currently Consuming</h2>
        <a className="text-sm font-bold text-primary hover:text-tertiary transition-colors" href="/library">View All Session</a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(item => {
          // ── DEBUG: Olhe no console do navegador para ver o nome exato! ──
          console.log("Inspecionando item do banco:", item);

          // Pega o progresso atual (tenta snake_case ou camelCase)
          const current = item.progress ?? item.currentProgress ?? 0;
          
          // Pega o total (tenta snake_case, camelCase ou totalProgressUnits)
          const total = item.total_progress ?? item.totalProgress ?? item.totalProgressUnits;

          // Proteção para o cálculo da porcentagem não quebrar (evita divisão por zero)
          const safeTotalForMath = total && total > 0 ? total : 1;
          const percent = Math.min(Math.round((current / safeTotalForMath) * 100), 100);
          
          return (
            <MediaCard 
              key={item.id} 
              variant="dashboard" 
              title={item.title} 
              image={item.cover_image_path ?? item.coverImageUrl} 
              
              subtitle={item.type} 
              currentProgress={current} 
              totalProgress={total} // Agora passamos a variável blindada
              
              percent={percent} 
              onClick={() => navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`)}
            />
          );
        })}
        {items.length === 0 && (
          <div className="col-span-4 py-8 text-center text-text-muted">
            You are not consuming anything at the moment.
          </div>
        )}
      </div>
    </section>
  );
};