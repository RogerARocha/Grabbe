import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EvaluationModal } from '../modals/EvaluationModal';

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Discover', path: '/discover', icon: 'travel_explore' },
  { name: 'Library', path: '/library', icon: 'movie_filter' },
  { name: 'Ranking', path: '/ranking', icon: 'leaderboard' },
  { name: 'Analytics', path: '/analytics', icon: 'monitoring' },
  { name: 'Community', path: '/community', icon: 'group' },
  { name: 'Settings', path: '/settings', icon: 'settings' }
];

export const Sidebar = () => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 h-full w-65 bg-surface flex flex-col pt-18 pb-8 px-4 z-40 bloom-shadow">
        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary font-bold border-r-2 border-primary'
                    : 'text-text-muted hover:bg-background hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-[14px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto px-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary py-3 rounded-lg text-on-primary font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="text-sm">New Evaluation</span>
          </button>
        </div>
      </aside>

      <EvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="add"
      />
    </>
  );
};
