import React from 'react';
import { useAppUpdater } from '../../contexts/UpdaterContext';

export const UpdateReadyModal: React.FC = () => {
  const {
    isReadyModalOpen,
    updateInfo,
    restartAndInstall,
    closeReadyModal,
  } = useAppUpdater();

  if (!isReadyModalOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface border border-outline-variant/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-ready-title"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#00E054]/10 border border-[#00E054]/30 flex items-center justify-center text-[#00E054] mx-auto shadow-lg shadow-[#00E054]/10">
            <span className="material-symbols-outlined text-3xl">published_with_changes</span>
          </div>

          <div className="space-y-1">
            <h3 id="update-ready-title" className="text-xl font-bold text-text-high font-heading">
              Update Ready to Install
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Grabbe <span className="text-text-high font-semibold">v{updateInfo.latestVersion}</span> has been downloaded successfully. Restart now to complete the installation and enjoy the latest features.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-container/50 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={closeReadyModal}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-high hover:bg-white/5 rounded-lg transition-all cursor-pointer select-none"
          >
            Restart Later
          </button>
          <button
            onClick={restartAndInstall}
            className="px-5 py-2 text-sm font-bold bg-[#00E054] text-[#14181C] hover:brightness-110 active:scale-95 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#00E054]/20 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            Restart & Install Now
          </button>
        </div>
      </div>
    </div>
  );
};
