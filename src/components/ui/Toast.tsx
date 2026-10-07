import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={18} className="text-brand-500 shrink-0" />,
  error: <XCircle size={18} className="text-rose-500 shrink-0" />,
  info: <Info size={18} className="text-sky-500 shrink-0" />,
}

export default function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: 'success' | 'error' | 'info'
  onDismiss: () => void
}) {
  return (
    <div className="animate-slide-in-right flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 shadow-lg min-w-[280px] max-w-sm">
      {icons[type]}
      <p className="text-sm text-slate-700 dark:text-slate-200 flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
