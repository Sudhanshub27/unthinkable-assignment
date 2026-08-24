import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, HelpCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from './UIComponents';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  isLoading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      badgeBg: 'bg-clay-500/10 border-clay-500/20 text-clay-600',
      icon: <Trash2 className="w-6 h-6" />,
      btnVariant: 'primary',
      btnClass: 'bg-clay-600 hover:bg-clay-700 text-white shadow-md',
    },
    warning: {
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
      icon: <AlertTriangle className="w-6 h-6" />,
      btnVariant: 'primary',
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md',
    },
    info: {
      badgeBg: 'bg-terracotta-500/10 border-terracotta-500/20 text-terracotta-500',
      icon: <HelpCircle className="w-6 h-6" />,
      btnVariant: 'primary',
      btnClass: '',
    },
    success: {
      badgeBg: 'bg-olive-500/10 border-olive-500/20 text-olive-600',
      icon: <CheckCircle2 className="w-6 h-6" />,
      btnVariant: 'primary',
      btnClass: 'bg-olive-600 hover:bg-olive-700 text-white shadow-md',
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-modal-backdrop"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-paper-card rounded-3xl shadow-2xl w-full max-w-md border border-line p-6 relative overflow-hidden animate-modal-card shrink-0 my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-ink-muted hover:text-ink hover:bg-paper-hover rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {/* Tinted Icon Badge */}
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${config.badgeBg}`}>
            {config.icon}
          </div>

          {/* Title & Message */}
          <div className="space-y-1.5 px-2">
            <h3 className="font-display text-lg font-bold text-ink leading-snug">{title}</h3>
            <p className="text-xs text-ink-secondary leading-relaxed max-w-xs mx-auto">{message}</p>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center gap-3 w-full pt-3">
            <Button
              type="button"
              variant="secondary"
              isFullWidth
              disabled={isLoading}
              onClick={onClose}
              className="rounded-xl font-semibold"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={config.btnVariant}
              isFullWidth
              isLoading={isLoading}
              onClick={onConfirm}
              className={`rounded-xl font-bold ${config.btnClass}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
