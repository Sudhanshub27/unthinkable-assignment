import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} flex items-center gap-2 px-3 py-2 rounded-lg shadow-md border text-xs font-medium`}>
            <span className="toast-icon shrink-0">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-olive-600" />
              ) : t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-clay-500" />
              ) : (
                <Info className="w-4 h-4 text-terracotta-400" />
              )}
            </span>
            <span className="toast-message flex-1">{t.message}</span>
            <button className="toast-close p-0.5 text-ink-muted hover:text-ink transition-colors" onClick={() => removeToast(t.id)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
