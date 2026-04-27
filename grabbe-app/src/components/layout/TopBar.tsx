export const TopBar = () => {
  return (
    <header className="sticky top-0 ml-[260px] h-20 bg-[#002b36]/80 backdrop-blur-xl z-10 flex items-center justify-between px-10 border-b border-white/5">
      {/* Search Input */}
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#93a1a1] pointer-events-none">
          search
        </span>
        <input 
          type="text" 
          placeholder="Search for movies, games, books..." 
          className="w-full bg-[#00212b] text-white placeholder-[#93a1a1] rounded-lg py-3 pl-12 pr-6 border-none focus:ring-2 focus:ring-[#00A3F5] outline-none transition-shadow"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#93a1a1] hover:text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#073642] text-[#00A3F5] hover:scale-110 active:scale-95 transition-transform border border-[#00A3F5]/20 bloom-shadow">
          <span className="material-symbols-outlined">person</span>
        </button>
      </div>
    </header>
  );
};
