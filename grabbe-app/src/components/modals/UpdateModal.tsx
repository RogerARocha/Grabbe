import React from 'react';
import { useAppUpdater } from '../../contexts/UpdaterContext';
import { openUrl } from '@tauri-apps/plugin-opener';

export const UpdateModal: React.FC = () => {
  const {
    isModalOpen,
    updateInfo,
    status,
    startDownload,
    closeUpdateModal,
  } = useAppUpdater();

  if (!isModalOpen || !updateInfo) return null;

  const handleOpenReleasePage = async () => {
    try {
      await openUrl(updateInfo.releaseUrl);
    } catch {
      window.open(updateInfo.releaseUrl, '_blank');
    }
  };

  const formatBytes = (bytes?: number) => {
    const num = Number(bytes);
    if (isNaN(num) || num <= 0) return '';
    const mb = num / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formattedDate = updateInfo.publishedAt
    ? new Date(updateInfo.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface border border-outline-variant/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-start justify-between relative bg-surface-container/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 primary-glow">
              <span className="material-symbols-outlined text-2xl">system_update</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="update-modal-title" className="text-xl font-bold text-text-high font-heading">
                  Update Available
                </h3>
                <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-semibold px-2 py-0.5 rounded-full">
                  v{updateInfo.latestVersion}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Current version: v{updateInfo.currentVersion}
                {formattedDate && ` • Released ${formattedDate}`}
              </p>
            </div>
          </div>

          <button
            onClick={closeUpdateModal}
            className="text-text-muted hover:text-text-high p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body / Release Notes */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">What's New in this Release</h4>
            {updateInfo.releaseNotes ? (
              <div className="bg-background/80 border border-white/5 rounded-xl p-4 text-sm text-text-medium leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans select-text">
                {updateInfo.releaseNotes}
              </div>
            ) : (
              <div className="bg-background/80 border border-white/5 rounded-xl p-4 text-sm text-text-muted italic">
                Performance enhancements, bug fixes, and usability improvements.
              </div>
            )}
          </div>

          {updateInfo.assetSize && (
            <div className="flex items-center justify-between text-xs text-text-muted px-1">
              <span>Download size:</span>
              <span className="font-mono text-text-high">{formatBytes(updateInfo.assetSize)}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-surface-container/50 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleOpenReleasePage}
            className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            GitHub Release Page
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={closeUpdateModal}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-high hover:bg-white/5 rounded-lg transition-all cursor-pointer select-none"
            >
              Later
            </button>
            <button
              onClick={startDownload}
              disabled={status === 'downloading'}
              className="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 primary-glow shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 select-none"
            >
              {status === 'downloading' ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Update in Background
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
