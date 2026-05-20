import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
  bottomOffsetClass?: string;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000, bottomOffsetClass }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getThemeDetails = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check_circle',
          iconColor: 'text-[#00E054]',
          borderColor: 'border-[#00E054]/30',
          glowColor: 'shadow-[#00E054]/10',
          bgGradient: 'from-[#073642]/95 to-[#073642]/90',
        };
      case 'error':
        return {
          icon: 'error',
          iconColor: 'text-[#dc322f]',
          borderColor: 'border-[#dc322f]/30',
          glowColor: 'shadow-[#dc322f]/10',
          bgGradient: 'from-[#073642]/95 to-[#073642]/90',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: 'text-[#b58900]',
          borderColor: 'border-[#b58900]/30',
          glowColor: 'shadow-[#b58900]/10',
          bgGradient: 'from-[#073642]/95 to-[#073642]/90',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: 'text-[#00A3F5]',
          borderColor: 'border-[#00A3F5]/30',
          glowColor: 'shadow-[#00A3F5]/10',
          bgGradient: 'from-[#073642]/95 to-[#073642]/90',
        };
    }
  };

  const theme = getThemeDetails();

  return (
    <div className={`fixed ${bottomOffsetClass || 'bottom-6'} right-6 z-50 bg-linear-to-r ${theme.bgGradient} backdrop-blur-md border ${theme.borderColor} rounded-xl p-4 flex items-start gap-3.5 animate-in slide-in-from-bottom-5 w-95 max-w-[calc(100vw-2rem)] shadow-2xl ${theme.glowColor} transition-all duration-300`}>
      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 ${theme.iconColor} shrink-0`}>
        <span className="material-symbols-outlined text-[20px]">{theme.icon}</span>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 justify-center py-0.5">
        <p className="text-sm font-medium text-text-high leading-snug selectable-text">
          {message}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="text-text-muted hover:text-text-high transition-colors cursor-pointer flex items-center self-start mt-0.5 p-0.5 rounded hover:bg-white/5"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
