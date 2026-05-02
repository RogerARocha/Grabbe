import { useNavigate } from "react-router-dom"

export const TopBar = () => {
  const navigation = useNavigate();

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-16 bg-background/60 backdrop-blur-md flex justify-between items-center px-12 z-40">
      <div className="flex items-center bg-surface rounded-lg px-4 py-1.5 w-96">
        <span className="material-symbols-outlined text-text-muted text-[20px]">search</span>
        <input 
          className="bg-transparent border-none focus:ring-0 text-sm text-text-high placeholder:text-text-muted w-full outline-none ml-2" 
          placeholder="Search evaluations..." 
          type="text"
        />
      </div>

      <div className="flex items-center gap-6">
        {/* <div className="flex gap-4">
          <button className="text-text-muted hover:text-tertiary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div> */}
        <div onClick={() => navigation('/profile')}
        className="flex items-center gap-3 pl-6 border-l border-outline-variant/20">
          <div className="text-right">
            <p className="text-[11px] font-bold text-text-high">Alex Rivera</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider">Premium Member</p>
          </div>
          <img 
            className="w-8 h-8 rounded-full border border-primary/20" 
            alt="User avatar" 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
          />
        </div>
      </div>
    </header>
  );
};
