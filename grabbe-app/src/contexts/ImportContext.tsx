import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImportProgress {
  current: number;
  total: number;
}

interface ImportContextType {
  isImporting: boolean;
  setIsImporting: (value: boolean) => void;
  progress: ImportProgress;
  setProgress: (value: ImportProgress) => void;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({ current: 0, total: 0 });

  return (
    <ImportContext.Provider value={{ isImporting, setIsImporting, progress, setProgress }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImportProgress() {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error('useImportProgress must be used within an ImportProvider');
  }
  return context;
}
