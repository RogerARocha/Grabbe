export interface ScoreOption {
  value: number;
  label: string;
  colorClass: string;
  bgHoverClass: string;
}

export const SCORE_OPTIONS: ScoreOption[] = [
  { value: 10, label: 'Masterpiece', colorClass: 'prismatic-text-blue prismatic-text-blue-hover', bgHoverClass: 'hover:bg-error/10' },
  { value: 9, label: 'Great', colorClass: 'text-primary', bgHoverClass: 'hover:bg-primary/10' },
  { value: 8, label: 'Very Good', colorClass: 'text-secondary', bgHoverClass: 'hover:bg-secondary/10' },
  { value: 7, label: 'Good', colorClass: 'text-secondary', bgHoverClass: 'hover:bg-secondary/10' },
  { value: 6, label: 'Fine', colorClass: 'text-warning', bgHoverClass: 'hover:bg-warning/10' },
  { value: 5, label: 'Average', colorClass: 'text-warning', bgHoverClass: 'hover:bg-warning/10' },
  { value: 4, label: 'Bad', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
  { value: 3, label: 'Very Bad', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
  { value: 2, label: 'Horrible', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
  { value: 1, label: 'Appalling', colorClass: 'text-error', bgHoverClass: 'hover:bg-error/10' },
];
