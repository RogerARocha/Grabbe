import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { importMediaFromFile } from '../lib/importService';
import { useImportProgress } from '../contexts/ImportContext';

export const Settings = () => {
  const { isImporting, setIsImporting, setProgress } = useImportProgress();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, provider: 'mal' | 'letterboxd') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      
      await importMediaFromFile(file, provider, (current, total) => {
        setProgress({ current, total });
      });

      alert('Import completed successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Error during import. Check console.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        <header className="px-8 py-8">
          <h1 className="text-3xl font-bold font-heading text-text-high tracking-tight">Settings</h1>
          <p className="text-text-muted mt-2">Manage your preferences and data imports.</p>
        </header>

        <div className="px-8 flex flex-col gap-6 max-w-4xl">
          <section className="bg-surface p-6 rounded-2xl border border-white/5 space-y-4 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-text-high">Data Import</h2>
            <p className="text-text-muted text-sm">
              Import your existing library from MyAnimeList (XML) or Letterboxd (CSV).
            </p>
            
            <div className="flex gap-4 mt-4">
              <label className="cursor-pointer bg-[#2E51A2] text-white px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all flex items-center gap-2">
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

              <label className="cursor-pointer bg-[#00E054] text-[#14181C] px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all flex items-center gap-2">
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
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
