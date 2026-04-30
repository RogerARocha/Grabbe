export type MediaStatus = 'CONSUMING' | 'COMPLETED' | 'DROPPED' | 'PLANNED' | 'PENDING';

export interface LibraryCardProps {
  title: string;
  subtitle: string;
  image: string;
  status: MediaStatus;
}

const statusConfig: Record<MediaStatus, { bg: string, text: string, border: string }> = {
  CONSUMING: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary' },
  COMPLETED: { bg: 'bg-secondary/15', text: 'text-secondary', border: 'border-secondary' },
  DROPPED: { bg: 'bg-tertiary/15', text: 'text-tertiary', border: 'border-tertiary' },
  PLANNED: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning' },
  PENDING: { bg: 'bg-[#A0AEC0]/15', text: 'text-[#A0AEC0]', border: 'border-[#A0AEC0]' }
};

export const LibraryCard = ({ title, subtitle, image, status }: LibraryCardProps) => {
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
        <p className="text-[11px] text-text-muted mt-1 font-medium">{subtitle}</p>
      </div>
    </div>
  );
};
