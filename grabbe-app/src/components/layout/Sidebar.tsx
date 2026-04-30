import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Library', path: '/library', icon: 'movie_filter' },
  { name: 'Analytics', path: '/analytics', icon: 'monitoring' },
  { name: 'Community', path: '/community', icon: 'group' },
  { name: 'Settings', path: '/settings', icon: 'settings' }
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface flex flex-col py-8 px-4 z-50 bloom-shadow">
      {/* Logo */}
      <div className="mb-12 px-4">
        <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Grabbe</span>
        <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase mt-1">The Cinematic Critic</p>
      </div>

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
        <button className="w-full bg-primary py-3 rounded-lg text-on-primary font-bold flex items-center justify-center gap-2 hover:bg-gradient-to-r hover:from-primary hover:to-tertiary transition-all duration-300">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="text-sm">New Evaluation</span>
        </button>
      </div>
    </aside>
  );
};
