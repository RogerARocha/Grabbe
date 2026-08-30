import React from 'react';
import { useAppUpdater } from '../../contexts/UpdaterContext';

export const UpdateBanner: React.FC = () => {
  const {
    status,
    updateInfo,
    downloadProgress,
    isBannerDismissed,
    openReadyModal,
    restartAndInstall,
    dismissBanner,
  } = useAppUpdater();

  if (isBannerDismissed || !updateInfo) return null;

  if (status === 'downloading') {
    const downloadedBytes = Number(downloadProgress.downloadedBytes) || 0;
    const totalBytes = Number(downloadProgress.totalBytes) || Number(updateInfo.assetSize) || 0;

    const downloadedMb = (downloadedBytes / (1024 * 1024)).toFixed(1);
    const totalMb = totalBytes > 0
      ? (totalBytes / (1024 * 1024)).toFixed(1)
      : null;
    const percentage = Number(downloadProgress.percentage) || (totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0);

    return (
      <div className="fixed bottom-6 right-6 z-40 bg-surface/95 backdrop-blur-md border border-primary/30 rounded-xl p-4 shadow-2xl shadow-black/80 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-bold text-text-high">
              Downloading Grabbe v{updateInfo.latestVersion}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary transition-all duration-150 primary-glow"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>
            {totalMb ? `${downloadedMb} MB of ${totalMb} MB` : `${downloadedMb} MB downloaded`}
          </span>
          <button
            onClick={dismissBanner}
            className="hover:text-text-high transition-colors cursor-pointer"
          >
            Hide
          </button>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="fixed bottom-6 right-6 z-40 bg-surface/95 backdrop-blur-md border border-[#00E054]/30 rounded-xl p-4 shadow-2xl shadow-black/80 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#00E054]/10 border border-[#00E054]/30 flex items-center justify-center text-[#00E054] shrink-0">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-high truncate">
              Update Ready (v{updateInfo.latestVersion})
            </p>
            <button
              onClick={openReadyModal}
              className="text-[11px] text-[#00E054] hover:underline cursor-pointer"
            >
              View details
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={restartAndInstall}
            className="px-3 py-1.5 text-xs font-bold bg-[#00E054] text-[#14181C] hover:brightness-110 active:scale-95 rounded-lg transition-all flex items-center gap-1 shadow-md shadow-[#00E054]/20 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Restart
          </button>
          <button
            onClick={dismissBanner}
            className="text-text-muted hover:text-text-high p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
