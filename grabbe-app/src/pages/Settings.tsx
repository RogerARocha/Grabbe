import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { importMediaFromFile, importBackupData } from '../lib/importService';
import { useImportProgress } from '../contexts/ImportContext';
import { exportLibraryData, getSetting, setSetting, deleteSetting } from '../lib/db';
import { openPath } from '@tauri-apps/plugin-opener';
import { downloadDir, join } from '@tauri-apps/api/path';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';

export const Settings = () => {
  const { isImporting, setIsImporting, setProgress } = useImportProgress();
  const { showToast } = useToast();
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  // BYOK Credentials state
  const [tmdbKey, setTmdbKey] = useState('');
  const [igdbClientId, setIgdbClientId] = useState('');
  const [igdbClientSecret, setIgdbClientSecret] = useState('');

  // Initial credentials state for dirty checking
  const [initialTmdbKey, setInitialTmdbKey] = useState('');
  const [initialIgdbClientId, setInitialIgdbClientId] = useState('');
  const [initialIgdbClientSecret, setInitialIgdbClientSecret] = useState('');

  // UI state for Save/Clear actions
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNetflixConfirmOpen, setIsNetflixConfirmOpen] = useState(false);
  const [netflixFile, setNetflixFile] = useState<File | null>(null);

  // Load existing credentials from SQLite on mount
  useEffect(() => {
    async function loadCredentials() {
      const tmdb = await getSetting('TMDB_API_KEY');
      const client = await getSetting('IGDB_CLIENT_ID');
      const secret = await getSetting('IGDB_CLIENT_SECRET');
      if (tmdb) {
        setTmdbKey(tmdb);
        setInitialTmdbKey(tmdb);
      }
      if (client) {
        setIgdbClientId(client);
        setInitialIgdbClientId(client);
      }
      if (secret) {
        setIgdbClientSecret(secret);
        setInitialIgdbClientSecret(secret);
      }
    }
    loadCredentials();
  }, []);

  const handleSaveKeys = async () => {
    setIsSaving(true);
    try {
      await setSetting('TMDB_API_KEY', tmdbKey.trim());
      await setSetting('IGDB_CLIENT_ID', igdbClientId.trim());
      await setSetting('IGDB_CLIENT_SECRET', igdbClientSecret.trim());
      await deleteSetting('SKIP_KEYS');

      setInitialTmdbKey(tmdbKey.trim());
      setInitialIgdbClientId(igdbClientId.trim());
      setInitialIgdbClientSecret(igdbClientSecret.trim());

      showToast('API Credentials saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save credentials:', error);
      showToast('Failed to save credentials. Please check console.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearKeys = async () => {
    setIsConfirmOpen(false);
    try {
      await deleteSetting('TMDB_API_KEY');
      await deleteSetting('IGDB_CLIENT_ID');
      await deleteSetting('IGDB_CLIENT_SECRET');
      await setSetting('SKIP_KEYS', 'true');

      setTmdbKey('');
      setIgdbClientId('');
      setIgdbClientSecret('');

      setInitialTmdbKey('');
      setInitialIgdbClientId('');
      setInitialIgdbClientSecret('');

      showToast('API Credentials cleared successfully!', 'success');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      showToast('Failed to clear credentials. Please check console.', 'error');
    }
  };

  const isDirty =
    tmdbKey.trim() !== initialTmdbKey ||
    igdbClientId.trim() !== initialIgdbClientId ||
    igdbClientSecret.trim() !== initialIgdbClientSecret;

  const hasKeys =
    tmdbKey.trim() !== '' ||
    igdbClientId.trim() !== '' ||
    igdbClientSecret.trim() !== '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, provider: 'mal' | 'letterboxd' | 'netflix') => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    try {
      setIsImporting(true);

      const result = await importMediaFromFile(file, provider, (current, total) => {
        setProgress({ current, total });
      });

      if (result.skippedCount > 0) {
        showToast(`Import completed! Imported ${result.importedCount} items, skipped ${result.skippedCount} duplicates.`, 'success');
      } else {
        showToast('Import completed successfully!', 'success');
      }
    } catch (error) {
      console.error('Import failed:', error);
      showToast('Error during import. Check console for details.', 'error');
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleNetflixFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setNetflixFile(file);
    setIsNetflixConfirmOpen(true);
  };

  const handleConfirmNetflixImport = async () => {
    setIsNetflixConfirmOpen(false);
    if (!netflixFile) return;

    try {
      setIsImporting(true);
      const result = await importMediaFromFile(netflixFile, 'netflix', (current, total) => {
        setProgress({ current, total });
      });

      if (result.skippedCount > 0) {
        showToast(`Import completed! Imported ${result.importedCount} items, skipped ${result.skippedCount} duplicates.`, 'success');
      } else {
        showToast('Import completed successfully!', 'success');
      }
    } catch (error) {
      console.error('Import failed:', error);
      showToast('Error during import. Check console for details.', 'error');
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
      setNetflixFile(null);
    }
  };

  const handleBackupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    try {
      setIsImporting(true);

      const text = await file.text();
      const backupData = JSON.parse(text);

      await importBackupData(backupData, (current, total) => {
        setProgress({ current, total });
      });

      showToast('Backup restored successfully!', 'success');
    } catch (error: any) {
      console.error('Backup restore failed:', error);
      showToast(`Error during restore: ${error.message || error}`, 'error');
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleBackupExport = async () => {
    if (isExporting || hasExported) return;
    try {
      setIsExporting(true);
      const backupObj = await exportLibraryData();
      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `grabbe-backup-${dateStr}.json`;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadedFile(fileName);
      setShowNotification(true);
      setHasExported(true);

      setTimeout(() => {
        setHasExported(false);
      }, 5000);
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Error exporting library data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShowInFolder = async () => {
    try {
      const dir = await downloadDir();
      await openPath(dir);
    } catch (error) {
      console.error('Failed to open downloads folder:', error);
    }
  };

  const handleOpenFile = async () => {
    if (!downloadedFile) return;
    try {
      const dir = await downloadDir();
      const filePath = await join(dir, downloadedFile);
      await openPath(filePath);
    } catch (error) {
      console.error('Failed to open backup file:', error);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        <header className="px-8 py-8">
          <h1 className="text-3xl font-bold font-heading text-text-high tracking-tight">Settings</h1>
          <p className="text-text-muted mt-2">Manage your preferences, data imports, and backups.</p>
        </header>

        <div className="px-8 flex flex-col gap-6 max-w-4xl">
          {/* Section: Data Import & Backup Restore */}
          <section className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-text-high flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              Data Import & Restore
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Restore your library from a previously saved Grabbe backup file, or ingest titles from popular services like MyAnimeList (XML) and Letterboxd (CSV).
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <label className="cursor-pointer bg-[#2E51A2] text-white px-4 py-2.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Import MyAnimeList
                <input
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'mal')}
                  disabled={isImporting}
                />
              </label>

              <label className="cursor-pointer bg-[#00E054] text-[#14181C] px-4 py-2.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Import Letterboxd
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'letterboxd')}
                  disabled={isImporting}
                />
              </label>

              <label className="cursor-pointer bg-surface-container border border-outline-variant/20 text-text-high px-4 py-2.5 rounded-lg font-bold hover:bg-surface-container/80 active:scale-95 transition-all flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
                Restore Grabbe Backup
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleBackupChange}
                  disabled={isImporting}
                />
              </label>
            </div>
          </section>

          {/* Section: Import Streaming History */}
          <section className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-text-high flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Import Streaming History
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Upload your Netflix viewing history CSV file to import your watched series, anime, and movies, automatically tracking your progress and dates.
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex flex-wrap gap-4">
                <label
                  className={`cursor-pointer bg-[#E50914] text-white px-4 py-2.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 select-none ${(isImporting || !initialTmdbKey.trim()) ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Import Netflix History
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleNetflixFileChange}
                    disabled={isImporting || !initialTmdbKey.trim()}
                  />
                </label>
              </div>
              {!initialTmdbKey.trim() && (
                <p className="text-error text-xs flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Requires a TMDB API Key configured in the credentials section below to import.
                </p>
              )}
            </div>
          </section>

          {/* Section: Data Backup & Export */}
          <section className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-text-high flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">download</span>
              Library Backup & Export
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Export your entire local library — including all cached media definitions, status tracking, rating history, scores, custom reviews, and chronological consumption timelines — into a standard JSON file.
            </p>

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleBackupExport}
                disabled={isImporting || isExporting || hasExported}
                className="cursor-pointer bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 primary-glow shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {hasExported ? 'check_circle' : isExporting ? 'hourglass_empty' : 'download'}
                </span>
                {hasExported ? 'Library Exported' : isExporting ? 'Exporting...' : 'Export Grabbe Library'}
              </button>
            </div>
          </section>

          {/* Section: API Configurations (BYOK) */}
          <section className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-text-high flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">key</span>
              API Credentials (BYOK)
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Configure your personal API keys to connect directly to metadata providers. These keys are stored securely in your local SQLite database.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">TMDB API Key (Bearer Token)</label>
                <input
                  type="password"
                  value={tmdbKey}
                  onChange={(e) => setTmdbKey(e.target.value)}
                  placeholder="Enter TMDB Bearer Token..."
                  className="w-full bg-background border border-outline-variant/10 rounded-lg text-sm px-4 py-2.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Twitch/IGDB Client ID</label>
                  <input
                    type="text"
                    value={igdbClientId}
                    onChange={(e) => setIgdbClientId(e.target.value)}
                    placeholder="Enter Client ID..."
                    className="w-full bg-background border border-outline-variant/10 rounded-lg text-sm px-4 py-2.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Twitch/IGDB Client Secret</label>
                  <input
                    type="password"
                    value={igdbClientSecret}
                    onChange={(e) => setIgdbClientSecret(e.target.value)}
                    placeholder="Enter Client Secret..."
                    className="w-full bg-background border border-outline-variant/10 rounded-lg text-sm px-4 py-2.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 text-warning text-xs p-3.5 rounded-xl flex gap-2.5 items-start mt-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">warning</span>
                <span>
                  <strong>Warning:</strong> Clearing your credentials will disconnect the application from global media databases. Manual library entries can still be created, but automatic details lookup, cover art, and casts will be disabled.
                </span>
              </div>

              <div className="flex justify-end pt-2 gap-3">
                <button
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={!hasKeys}
                  className="cursor-pointer bg-error/10 text-error hover:bg-error/20 px-6 py-2 rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 select-none"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Clear Credentials
                </button>
                <button
                  onClick={handleSaveKeys}
                  disabled={!isDirty || isSaving}
                  className="cursor-pointer bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 primary-glow shadow-md shadow-primary/20 select-none"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Save Credentials
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/*Download Completion Bubble */}
      {showNotification && downloadedFile && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface/95 backdrop-blur-md border border-primary/30 bloom-shadow rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-bottom-5 w-105 shadow-2xl shadow-black/60">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-2xl animate-pulse">download_done</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text-high">Backup Downloaded</span>
              <button
                onClick={() => setShowNotification(false)}
                className="text-text-muted hover:text-text-high transition-colors cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <span className="text-xs text-text-muted truncate font-mono mt-1">
              {downloadedFile}
            </span>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleShowInFolder}
                className="cursor-pointer bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 select-none"
              >
                <span className="material-symbols-outlined text-[14px]">folder_open</span>
                Show in Folder
              </button>
              <button
                onClick={handleOpenFile}
                className="cursor-pointer bg-surface-container border border-outline-variant/30 text-text-high hover:bg-surface-container/80 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 select-none"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                Open Backup
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Clear API Credentials?"
        message="Are you sure you want to clear your API credentials? This will disable metadata fetching and online features until configured again."
        confirmLabel="Clear Keys"
        cancelLabel="Keep Keys"
        type="danger"
        onConfirm={handleClearKeys}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ConfirmationModal
        isOpen={isNetflixConfirmOpen}
        title="Import Netflix History?"
        message="Netflix history files contain raw episode titles, sometimes this can lead to incorrect metadata matching. 
                Automated metadata lookups will run for all new shows/movies, which may take a few minutes depending on your history size. 
                Please note that the engine might occasionally map the incorrect media due to translations, regional availability, or other matching issues. 
                We suggest reviewing your imported library afterward; if you find any incorrect media links, you can manually Unlink them from their details page."
        confirmLabel="Import History"
        cancelLabel="Cancel"
        type="warning"
        onConfirm={handleConfirmNetflixImport}
        onCancel={() => {
          setIsNetflixConfirmOpen(false);
          setNetflixFile(null);
        }}
      />
    </MainLayout>
  );
};
