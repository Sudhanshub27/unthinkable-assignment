import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '680px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-paper-card rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative border border-line my-auto animate-modal-card"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-paper-card">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-hover rounded-xl transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
