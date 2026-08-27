import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 shadow-xl text-sm font-medium animate-fadeIn">
      <CheckCircle2 className="w-5 h-5 shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
