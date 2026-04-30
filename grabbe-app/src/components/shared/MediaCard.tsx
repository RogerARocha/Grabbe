export type MediaStatus = 'CONSUMING' | 'COMPLETED' | 'DROPPED' | 'PLANNED' | 'PENDING';

export interface MediaCardProps {
  variant?: 'library' | 'dashboard';
  title: string;
  subtitle?: string; // e.g. "S1: E08 of 12" or "Film • 2023"
  image: string;
  status?: MediaStatus; // mainly for library
  percent?: number; // mainly for dashboard progress
}

const statusConfig: Record<MediaStatus, { bg: string, text: string, border: string }> = {
  CONSUMING: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary' },
  COMPLETED: { bg: 'bg-secondary/15', text: 'text-secondary', border: 'border-secondary' },
  DROPPED: { bg: 'bg-tertiary/15', text: 'text-tertiary', border: 'border-tertiary' },
  PLANNED: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning' },
  PENDING: { bg: 'bg-[#A0AEC0]/15', text: 'text-[#A0AEC0]', border: 'border-[#A0AEC0]' }
};

export const MediaCard = ({ 
  variant = 'library', 
  title, 
  subtitle, 
  image, 
  status = 'PENDING', 
  percent 
}: MediaCardProps) => {
  
  if (variant === 'dashboard') {
    return (
      <div className="group relative bg-surface rounded-lg p-2 transition-transform duration-200 hover:scale-[1.05] primary-glow cursor-pointer">
        <div className="relative w-full aspect-[2/3] max-h-[240px] rounded-lg overflow-hidden border-2 border-primary mb-3">
          <img className="w-full h-full object-cover" alt={title} src={image} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute top-2 right-2 px-2 py-1 glass-panel rounded-full text-[10px] font-bold text-secondary uppercase">Active</div>
        </div>
        <h3 className="font-bold text-sm truncate px-1 text-text-high">{title}</h3>
        <div className="px-1 mt-2">
          {percent !== undefined && (
            <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }}></div>
            </div>
          )}
          {subtitle && <p className="text-[9px] text-text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  }

  // default 'library' variant
  const config = statusConfig[status];
  return (
    <div className="flex flex-col gap-3 group cursor-pointer">
      <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-container bloom-shadow transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.05] border-2 ${config.border} hover:border-outline-variant/60`}>
        <img 
          className="w-full h-full object-cover" 
          alt={title} 
          src={image} 
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 ${config.bg} ${config.text} text-[10px] font-bold tracking-wider rounded-full backdrop-blur-md`}>
            {status}
          </span>
        </div>
      </div>
      <div className="px-1">
        <h3 className="text-sm font-semibold text-text-high truncate leading-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-text-muted mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};
