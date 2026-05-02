import type { FeatureConfig } from './data';

interface FeatureContentProps {
  config: FeatureConfig;
}

export function FeatureContent({ config }: FeatureContentProps) {
  return (
    <>
      {/* Phase badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.accentBg} border ${config.accentBorder} mb-8`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.phaseColor}`}>
          {config.phase} · In Development
        </span>
      </div>

      {/* Icon */}
      <div className={`w-28 h-28 rounded-2xl ${config.accentBg} border ${config.accentBorder} flex items-center justify-center bloom-shadow mb-8`}>
        <span className={`material-symbols-outlined text-5xl ${config.accentColor}`}>
          {config.icon}
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="text-5xl font-black tracking-tighter mb-4">
        <span className="text-text-high">{config.label}</span>
        <br />
        <span className="prismatic-text">is coming.</span>
      </h1>
      <p className="text-base text-text-muted leading-relaxed mb-10">
        {config.description}
      </p>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent mb-10" />

      {/* Planned features */}
      <div className="w-full text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-5">
          What's planned
        </p>
        <div className="space-y-3">
          {config.bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className={`w-5 h-5 rounded-full ${config.accentBg} border ${config.accentBorder} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[12px] ${config.accentColor}`}>add</span>
              </div>
              <p className="text-sm text-text-muted group-hover:text-text-base transition-colors font-medium">
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}