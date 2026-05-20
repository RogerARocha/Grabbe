import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from '../components/shared/Toast';
import { useImportProgress } from './ImportContext';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const { isImporting } = useImportProgress();

  const showToast = (message: string, type: ToastType = 'info') => {
    // Generate a unique ID to force re-render/re-mount of Toast (resetting timer)
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          bottomOffsetClass={isImporting ? 'bottom-28' : 'bottom-6'}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
