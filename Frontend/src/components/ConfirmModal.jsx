import { AlertTriangle, Info, X } from 'lucide-react';

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconWrap: 'bg-rose-500/10 text-rose-500',
    confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-amber-500/10 text-amber-500',
    confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
  },
  info: {
    icon: Info,
    iconWrap: 'bg-blue-500/10 text-blue-500',
    confirmBtn: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
};

export default function ConfirmModal({
  open,
  title,
  message,
  type = 'confirm',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const styles = variantStyles[variant] || variantStyles.danger;
  const Icon = styles.icon;
  const isAlert = type === 'alert';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-modal-title" className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {title}
            </h3>
            {message && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {!isAlert && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
