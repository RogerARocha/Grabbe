import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Library', path: '/library', icon: 'library_books' },
  { name: 'Analytics', path: '/analytics', icon: 'analytics' }

];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#073642] flex flex-col py-6 border-r border-white/5">
      {/* Logo */}
      <div className="px-6 mb-10">
        <h1 className="text-3xl font-black tracking-tighter prismatic-text">Grabbe</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] active:scale-95 ${
                isActive 
                  ? 'bg-[#00212b] text-[#00A3F5] border-l-4 border-[#00A3F5]' 
                  : 'text-[#93a1a1] hover:text-white border-l-4 border-transparent hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-bold text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 mt-auto">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#93a1a1] hover:text-white transition-all duration-200 hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="font-bold text-sm tracking-wide">Settings</span>
        </Link>
      </div>
    </aside>
  );
};
