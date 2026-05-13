import { useNavigate } from 'react-router-dom';

interface RankingRowProps {
  item: any;
  onOpenModal: (item: any) => void;
}

const getScoreStyles = (score: number) => {
  if (score === 10) return { bar: 'prismatic-bg-blue', text: 'prismatic-text-blue' };
  if (score === 9) return { bar: 'bg-primary', text: 'text-primary' };
  if (score >= 7) return { bar: 'bg-secondary', text: 'text-secondary' };
  if (score >= 5) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-error', text: 'text-error' };
};

export const RankingRow = ({ item, onOpenModal }: RankingRowProps) => {
  const navigate = useNavigate();
  const styles = getScoreStyles(item.score);

  const handleNavigate = () => {
    navigate(`/media/${item.external_id}?source=${item.source_api}&type=${item.type}`);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal(item);
  };

  return (
    <div 
      className="bg-surface rounded-lg flex items-stretch h-24 mb-4 bloom-shadow group overflow-hidden cursor-pointer hover:bg-surface-container transition-colors duration-200"
      onClick={handleNavigate}
    >
      {/* Score Bar */}
      <div className={`w-2 shrink-0 ${styles.bar}`} />

      {/* Content Container */}
      <div className="flex flex-1 items-center px-4 gap-6">
        
        {/* Cover Image */}
        <div 
          className="h-16 w-12 shrink-0 rounded overflow-hidden bg-surface-container-high relative bloom-shadow group/img"
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate();
          }}
        >
          {item.cover_image_path || item.coverImageUrl ? (
            <img 
              src={item.cover_image_path || item.coverImageUrl} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-text-muted text-sm">image</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 overflow-hidden" onClick={handleNavigate}>
          <h3 className="text-lg font-black text-text-high truncate group-hover:underline group-hover:text-primary transition-colors cursor-pointer">
            {item.title}
          </h3>
        </div>

        {/* Columns Container (Clickable for Modal) */}
        <div 
          className="flex items-center gap-12 shrink-0 h-full px-4 hover:bg-surface-container-high transition-colors rounded-lg"
          onClick={handleInfoClick}
        >
          {/* Score Column */}
          <div className="flex flex-col items-center justify-center w-16">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Score</span>
            <span className={`text-xl font-bold font-mono ${styles.text}`}>
              {item.score}
            </span>
          </div>

          {/* Type Column */}
          <div className="flex flex-col items-center justify-center w-20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Type</span>
            <span className="text-sm font-bold text-text-base">
              {item.type}
            </span>
          </div>

          {/* Progress Column */}
          <div className="flex flex-col items-center justify-center w-24">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Progress</span>
            <span className="text-sm font-bold text-text-base">
              {item.type === 'MOVIE' && item.status === 'COMPLETED' ? '1 / 1' : `${item.progress} / ${item.total_progress || '?'}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
