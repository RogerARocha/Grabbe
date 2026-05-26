import { calculateInvestedMinutes } from '../../lib/timeMetrics';

export const CategoryGrid = ({ items = [] }: { items: any[] }) => {
  const completedItems = items.filter(i => i.status === 'COMPLETED');

  const movies = completedItems.filter(i => i.type === 'MOVIE');
  const moviesMinutes = movies.reduce((acc, item) => acc + calculateInvestedMinutes(item.type, item.consumption_metric, item.progress || 0), 0);

  const series = completedItems.filter(i => i.type === 'SERIES' || i.type === 'ANIME');
  const seriesEpisodes = series.reduce((acc, item) => acc + (item.progress || 0), 0);
  const seriesMinutes = series.reduce((acc, item) => acc + calculateInvestedMinutes(item.type, item.consumption_metric, item.progress || 0), 0);

  const books = completedItems.filter(i => i.type === 'BOOK' || i.type === 'MANGA' || i.type === 'COMIC');
  const booksPages = books.reduce((acc, item) => acc + (item.progress || 0), 0);
  const booksVolumes = books.length;

  const games = completedItems.filter(i => i.type === 'GAME');
  const gamesCompleted = games.length;
  const gamesMinutes = games.reduce((acc, item) => acc + calculateInvestedMinutes(item.type, item.consumption_metric, item.progress || 0), 0);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Movies */}
      <div className="bg-surface rounded-xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bloom-shadow border border-surface-container-high">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">movie</span>
          </div>
          <span className="text-xs font-bold text-text-muted bg-surface-container px-2 py-1 rounded">Movies</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-high mb-1">{movies.length} <span className="text-sm text-text-muted font-normal">watched</span></p>
          <p className="text-sm font-bold text-primary">{Math.floor(moviesMinutes / 60)} hours</p>
        </div>
      </div>
      
      {/* Animes/Series */}
      <div className="bg-surface rounded-xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bloom-shadow border border-surface-container-high">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">animation</span>
          </div>
          <span className="text-xs font-bold text-text-muted bg-surface-container px-2 py-1 rounded">Series</span>
        </div>
        <div className="relative z-10">
          <p className="text-2xl font-bold text-text-high mb-1">{seriesEpisodes} <span className="text-sm text-text-muted font-normal">episodes</span></p>
          <p className="text-sm font-bold text-primary">{Math.floor(seriesMinutes / 60)} hours</p>
        </div>
      </div>

      {/* Reading */}
      <div className="bg-surface rounded-xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bloom-shadow border border-surface-container-high">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-[#859900]">menu_book</span>
          </div>
          <span className="text-xs font-bold text-text-muted bg-surface-container px-2 py-1 rounded">Reading</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-high mb-1">{booksPages} <span className="text-sm text-text-muted font-normal">pages read</span></p>
          <p className="text-sm font-bold text-[#859900]">{booksVolumes} volumes</p>
        </div>
      </div>

      {/* Games */}
      <div className="bg-surface rounded-xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bloom-shadow border border-surface-container-high">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-warning">sports_esports</span>
          </div>
          <span className="text-xs font-bold text-text-muted bg-surface-container px-2 py-1 rounded">Games</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-high mb-1">{gamesCompleted} <span className="text-sm text-text-muted font-normal">completed</span></p>
          <p className="text-sm font-bold text-warning">{Math.floor(gamesMinutes / 60)} hours</p>
        </div>
      </div>
    </section>
  );
};
