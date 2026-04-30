interface CastMember {
  name: string;
  role: string;
  image: string;
}

interface CastSectionProps {
  cast: CastMember[];
}

export const CastSection = ({ cast }: CastSectionProps) => {
  if (cast.length === 0) return null;

  return (
    <div className="pt-8 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Main Cast</h3>
      <div className="flex flex-wrap gap-4">
        {cast.map((actor, index) => (
          <div key={index} className="flex items-center gap-3 bg-surface-container p-2 pr-6 rounded-full border border-outline-variant/10 hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all bg-surface-container-highest flex items-center justify-center">
              <img alt={actor.name} className="w-full h-full object-cover" src={actor.image} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-text-high">{actor.name}</p>
              <p className="text-[10px] text-text-muted">{actor.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
