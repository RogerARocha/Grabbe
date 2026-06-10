import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { importMediaFromFile, importBackupData } from '../lib/importService';
import { useImportProgress } from '../contexts/ImportContext';
import { exportLibraryData, getSetting, setSetting } from '../lib/db';
import { openPath } from '@tauri-apps/plugin-opener';
import { downloadDir, join } from '@tauri-apps/api/path';
import { useToast } from '../contexts/ToastContext';

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

  // Load existing credentials from SQLite on mount
  useEffect(() => {
    async function loadCredentials() {
      const tmdb = await getSetting('TMDB_API_KEY');
      const client = await getSetting('IGDB_CLIENT_ID');
      const secret = await getSetting('IGDB_CLIENT_SECRET');
      if (tmdb) setTmdbKey(tmdb);
      if (client) setIgdbClientId(client);
      if (secret) setIgdbClientSecret(secret);
    }
    loadCredentials();
  }, []);

  const handleSaveKeys = async () => {
    try {
      await setSetting('TMDB_API_KEY', tmdbKey);
      await setSetting('IGDB_CLIENT_ID', igdbClientId);
      await setSetting('IGDB_CLIENT_SECRET', igdbClientSecret);
      showToast('API Credentials saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save credentials:', error);
      showToast('Failed to save credentials. Please check console.', 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, provider: 'mal' | 'letterboxd') => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    try {
      setIsImporting(true);
      
      await importMediaFromFile(file, provider, (current, total) => {
        setProgress({ current, total });
      });

      showToast('Import completed successfully!', 'success');
    } catch (error) {
      console.error('Import failed:', error);
      showToast('Error during import. Check console for details.', 'error');
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0 });
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

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveKeys}
                  className="cursor-pointer bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 primary-glow shadow-md shadow-primary/20 select-none"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Credentials
                </button>
              </div>
            </div>
          </section>

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
    </MainLayout>
  );
};
