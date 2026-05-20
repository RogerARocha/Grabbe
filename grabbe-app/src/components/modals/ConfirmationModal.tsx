import React from 'react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A stunning, premium Cinematic Solarized confirmation dialog modal.
 * Built with glassmorphism, glowing borders, smooth fade/scale transitions,
 * and high contrast micro-animations for destructive operations.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'warning',
          iconColor: 'text-[#dc322f]',
          iconBg: 'bg-[#dc322f]/10 border-[#dc322f]/20',
          confirmBtn: 'bg-[#dc322f] text-white hover:bg-[#dc322f]/90 active:scale-95 shadow-md shadow-[#dc322f]/20 hover:shadow-[#dc322f]/30',
          borderAccent: 'border-t-2 border-t-[#dc322f]/60',
        };
      case 'warning':
        return {
          icon: 'report_problem',
          iconColor: 'text-[#b58900]',
          iconBg: 'bg-[#b58900]/10 border-[#b58900]/20',
          confirmBtn: 'bg-[#b58900] text-white hover:bg-[#b58900]/90 active:scale-95 shadow-md shadow-[#b58900]/20 hover:shadow-[#b58900]/30',
          borderAccent: 'border-t-2 border-t-[#b58900]/60',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: 'text-[#00A3F5]',
          iconBg: 'bg-[#00A3F5]/10 border-[#00A3F5]/20',
          confirmBtn: 'bg-[#00A3F5] text-white hover:bg-[#00A3F5]/90 active:scale-95 shadow-md shadow-[#00A3F5]/20 hover:shadow-[#00A3F5]/30',
          borderAccent: 'border-t-2 border-t-[#00A3F5]/60',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onCancel}
        className="absolute inset-0 bg-[#001b22]/75 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal Dialog Box */}
      <div className={`relative w-full max-w-md bg-[#073642]/95 border border-white/10 ${styles.borderAccent} rounded-2xl shadow-2xl shadow-black/80 flex flex-col p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 bloom-shadow`}>
        
        {/* Header Block */}
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl border ${styles.iconBg} ${styles.iconColor} shrink-0`}>
            <span className="material-symbols-outlined text-[24px]">{styles.icon}</span>
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-lg font-bold text-text-high leading-tight select-none">
              {title}
            </h3>
            <p className="text-sm text-text-muted mt-2 leading-relaxed selectable-text">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex justify-end gap-3 mt-8 select-none">
          <button
            onClick={onCancel}
            className="cursor-pointer bg-surface-container border border-outline-variant/30 text-text-high hover:bg-surface-container/80 text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            className={`cursor-pointer text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${styles.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};
