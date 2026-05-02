export interface FeatureConfig {
  icon: string;
  label: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  phase: string;
  phaseColor: string;
  description: string;
  bullets: string[];
}

export const FEATURE_MAP: Record<string, FeatureConfig> = {
  analytics: {
    icon: 'monitoring',
    label: 'Deep Analytics',
    accentColor: 'text-primary',
    accentBg: 'bg-primary/10',
    accentBorder: 'border-primary/20',
    phase: 'Phase 2',
    phaseColor: 'text-primary',
    description:
      'Your taste, quantified. The Analytics dashboard will surface niche connections, genre bias, studio patterns, and a correlation between the scores you give and the year media was released — all computed locally from your library.',
    bullets: [
      'Consumption radar chart by media type',
      'Score distribution & bias analysis',
      'Studio / director taste patterns',
      'Genre heatmap over time',
    ],
  },
  community: {
    icon: 'group',
    label: 'Community',
    accentColor: 'text-tertiary',
    accentBg: 'bg-tertiary/10',
    accentBorder: 'border-tertiary/20',
    phase: 'Phase 3',
    phaseColor: 'text-tertiary',
    description:
      'Compare, discuss, and share. Community features are planned for Phase 3, when Grabbe Cloud syncs your local library to enable public profiles, director AMAs, and trending feeds from other evaluators.',
    bullets: [
      'Public profile at grabbe.app/u/you',
      'Trending evaluations feed',
      'Director & creator AMAs',
      'Friend comparison view',
    ],
  },
  settings: {
    icon: 'settings',
    label: 'Settings',
    accentColor: 'text-warning',
    accentBg: 'bg-warning/10',
    accentBorder: 'border-warning/20',
    phase: 'Phase 1 (upcoming)',
    phaseColor: 'text-warning',
    description:
      'Full control over how Grabbe looks, feels, and behaves. Settings will let you manage BFF API keys, choose alternate themes, configure auto-fill preferences, and set up import/export pipelines from MyAnimeList or Letterboxd.',
    bullets: [
      'BFF API key management (TMDB, Jikan, etc.)',
      'Theme selection (light, dark, OLED)',
      'Auto-fill date preferences',
      'Import from MyAnimeList / Letterboxd',
      'Local SQLite database backup & restore',
    ],
  },
  profile: {
    icon: 'account_circle',
    label: 'User Profile',
    accentColor: 'text-primary',
    accentBg: 'bg-primary/10',
    accentBorder: 'border-primary/20',
    phase: 'Phase 2',
    phaseColor: 'text-primary',
    description:
      'Your personal identity in the Grabbe ecosystem. Here you will be able to customize your avatar, manage your premium status, and view your overarching lifetime stats.',
    bullets: [
      'Custom avatar and banner upload',
      'Lifetime consumption statistics',
      'Data export and local database management',
    ],
  },
};