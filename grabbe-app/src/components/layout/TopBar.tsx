import { useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";

const handleMinimize = async () => {
  await getCurrentWindow().minimize();
};

const handleMaximize = async () => {
  await getCurrentWindow().toggleMaximize();
};

const handleClose = async () => {
  await getCurrentWindow().close();
};

const handleDragStart = async (e: React.MouseEvent) => {
  if (e.button !== 0) return;
  await getCurrentWindow().startDragging();
};

export const TopBar = () => {
  const navigation = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full h-10 bg-surface/80 backdrop-blur-md flex items-center z-50 border-b border-outline-variant/10 select-none">

      {/* Logo — draggable zone */}
      <div
        className="w-[260px] shrink-0 flex items-center px-6 h-full"
        onMouseDown={handleDragStart}
      >
        <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary pointer-events-none">
          Grabbe
        </span>
      </div>

      {/* Draggable spacer left of search */}
      <div
        className="flex-1 h-full"
        onMouseDown={handleDragStart}
      />

      {/* Search bar — not draggable */}
      <div className="flex items-center bg-background/70 rounded-lg px-4 py-1.5 w-80 shrink-0">
        <span className="material-symbols-outlined text-text-muted text-[20px]">search</span>
        <input
          className="bg-transparent border-none focus:ring-0 text-sm text-text-high placeholder:text-text-muted w-full outline-none ml-2"
          placeholder="Search evaluations..."
          type="text"
        />
      </div>

      {/* Draggable spacer right of search */}
      <div
        className="flex-1 h-full"
        onMouseDown={handleDragStart}
      />

      {/* User profile — not draggable */}
      <div
        onClick={() => navigation("/profile")}
        className="flex items-center gap-3 px-4 border-r border-outline-variant/20 cursor-pointer shrink-0"
      >
        <p className="text-[10px] font-bold text-text-high">Alex Rivera</p>
        <img
          className="w-6 h-6 rounded-full border border-primary/20"
          alt="User avatar"
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
        />
      </div>

      {/* Window controls */}
      <div className="flex items-stretch self-stretch shrink-0">
        <button
          onClick={handleMinimize}
          className="w-[46px] flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-text-high transition-colors cursor-default"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1"/>
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-[46px] flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-text-high transition-colors cursor-default"
          title="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9"/>
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-[46px] flex items-center justify-center text-text-muted hover:bg-[#c42b1c] hover:text-white transition-colors cursor-default"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M0 0.7L0.7 0L5 4.3L9.3 0L10 0.7L5.7 5L10 9.3L9.3 10L5 5.7L0.7 10L0 9.3L4.3 5L0 0.7Z"/>
          </svg>
        </button>
      </div>
    </header>
  );
};
