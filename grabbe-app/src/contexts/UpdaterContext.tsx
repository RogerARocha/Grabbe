import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';
import {
  checkAppUpdate,
  type UpdateCheckResult,
  type DownloadProgress,
} from '../lib/updater';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error' | 'up-to-date';

interface UpdaterContextType {
  status: UpdateStatus;
  updateInfo: UpdateCheckResult | null;
  downloadProgress: DownloadProgress;
  downloadedFilePath: string | null;
  isModalOpen: boolean;
  isReadyModalOpen: boolean;
  isBannerDismissed: boolean;
  error: string | null;
  checkForUpdates: (manual?: boolean) => Promise<UpdateCheckResult | null>;
  startDownload: () => Promise<void>;
  restartAndInstall: () => Promise<void>;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
  openReadyModal: () => void;
  closeReadyModal: () => void;
  dismissBanner: () => void;
}

const UpdaterContext = createContext<UpdaterContextType | undefined>(undefined);

const DISMISSED_VERSION_KEY = 'grabbe_dismissed_update_version';

export const UpdaterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    downloadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    done: false,
  });
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to progress events from the Rust backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setupListener() {
      if (isTauri()) {
        try {
          unlisten = await listen<any>('updater://progress', (event) => {
            const p = event.payload;
            if (p) {
              setDownloadProgress({
                downloadedBytes: Number(p.downloadedBytes ?? p.downloaded_bytes) || 0,
                totalBytes: Number(p.totalBytes ?? p.total_bytes) || 0,
                percentage: Number(p.percentage) || 0,
                done: Boolean(p.done),
              });
            }
          });
        } catch (err) {
          console.error('Failed to setup updater event listener:', err);
        }
      }
    }

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const checkForUpdates = useCallback(async (manual = false): Promise<UpdateCheckResult | null> => {
    setStatus('checking');
    setError(null);

    try {
      const result = await checkAppUpdate();
      setUpdateInfo(result);

      if (result.updateAvailable) {
        let cachedPath: string | null = null;
        if (isTauri() && result.assetName) {
          try {
            cachedPath = await invoke<string | null>('check_cached_installer', {
              filename: result.assetName,
            });
          } catch (e) {
            console.warn('Failed to check cached installer:', e);
          }
        }

        const dismissedVersion = sessionStorage.getItem(DISMISSED_VERSION_KEY);

        if (cachedPath) {
          setDownloadedFilePath(cachedPath);
          setStatus('ready');
          setDownloadProgress({
            downloadedBytes: result.assetSize || 0,
            totalBytes: result.assetSize || 0,
            percentage: 100,
            done: true,
          });
          if (manual || dismissedVersion !== result.latestVersion) {
            setIsReadyModalOpen(true);
          }
        } else {
          setStatus('available');
          // Only open modal automatically on startup if not previously dismissed in this session
          if (manual || dismissedVersion !== result.latestVersion) {
            setIsModalOpen(true);
          }
        }
        setIsBannerDismissed(false);
      } else {
        setStatus(manual ? 'up-to-date' : 'idle');
        // If up to date, clean up any remaining installer binaries in temp
        if (isTauri()) {
          invoke('cleanup_cached_installers').catch(() => {});
        }
      }

      return result;
    } catch (err: any) {
      console.error('Error during update check:', err);
      const errMsg = err?.message || 'Failed to check for updates';
      setError(errMsg);
      setStatus('error');
      return null;
    }
  }, []);

  // Perform automated check on startup with a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  const startDownload = useCallback(async () => {
    if (!updateInfo) return;

    // If no direct binary asset or not running inside Tauri, open browser download page
    if (!updateInfo.assetUrl || !isTauri()) {
      try {
        await openUrl(updateInfo.releaseUrl);
      } catch {
        window.open(updateInfo.releaseUrl, '_blank');
      }
      setIsModalOpen(false);
      return;
    }

    setStatus('downloading');
    setIsModalOpen(false);
    setIsBannerDismissed(false);
    setDownloadProgress({
      downloadedBytes: 0,
      totalBytes: updateInfo.assetSize || 0,
      percentage: 0,
      done: false,
    });

    try {
      const filename = updateInfo.assetName || `Grabbe-${updateInfo.latestVersion}-Setup.exe`;
      const filePath = await invoke<string>('download_update_file', {
        url: updateInfo.assetUrl,
        filename,
      });

      setDownloadedFilePath(filePath);
      setStatus('ready');
      setIsReadyModalOpen(true);
    } catch (err: any) {
      console.error('Error downloading update file:', err);
      setError(err?.message || String(err));
      setStatus('error');
    }
  }, [updateInfo]);

  const restartAndInstall = useCallback(async () => {
    if (!downloadedFilePath || !isTauri()) {
      if (updateInfo?.releaseUrl) {
        try {
          await openUrl(updateInfo.releaseUrl);
        } catch {
          window.open(updateInfo.releaseUrl, '_blank');
        }
      }
      return;
    }

    try {
      await invoke('launch_installer_and_exit', {
        filePath: downloadedFilePath,
      });
    } catch (err: any) {
      console.error('Failed to launch installer:', err);
      setError(err?.message || String(err));
    }
  }, [downloadedFilePath, updateInfo]);

  const openUpdateModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeUpdateModal = useCallback(() => {
    setIsModalOpen(false);
    if (updateInfo?.latestVersion) {
      sessionStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion);
    }
  }, [updateInfo]);

  const openReadyModal = useCallback(() => {
    setIsReadyModalOpen(true);
  }, []);

  const closeReadyModal = useCallback(() => {
    setIsReadyModalOpen(false);
    if (updateInfo?.latestVersion) {
      sessionStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion);
    }
  }, [updateInfo]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  return (
    <UpdaterContext.Provider
      value={{
        status,
        updateInfo,
        downloadProgress,
        downloadedFilePath,
        isModalOpen,
        isReadyModalOpen,
        isBannerDismissed,
        error,
        checkForUpdates,
        startDownload,
        restartAndInstall,
        openUpdateModal,
        closeUpdateModal,
        openReadyModal,
        closeReadyModal,
        dismissBanner,
      }}
    >
      {children}
    </UpdaterContext.Provider>
  );
};

export const useAppUpdater = () => {
  const context = useContext(UpdaterContext);
  if (!context) {
    throw new Error('useAppUpdater must be used within an UpdaterProvider');
  }
  return context;
};
