import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, differenceInDays } from 'date-fns'
import type { Deal, DealStage, Pipeline } from '../../lib/types'
import { PIPELINE_LABELS } from '../../lib/types'

const stageColors: Record<DealStage, string> = {
  prospecting: 'border-t-slate-400',
  qualification: 'border-t-indigo-400',
  proposal: 'border-t-amber-400',
  negotiation: 'border-t-orange-400',
  po_received: 'border-t-sky-400',
  order_confirmation: 'border-t-cyan-400',
  won: 'border-t-brand-500',
  lost: 'border-t-rose-400',
}

const PIPELINE_BADGE: Record<Pipeline, string> = {
  epr: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 ring-brand-600/20 dark:ring-brand-500/20',
  itad: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-indigo-600/20 dark:ring-indigo-500/20',
  rethink_plus: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-600/20 dark:ring-purple-500/20',
  ddrs: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-cyan-600/20 dark:ring-cyan-500/20',
}

function formatValue(v: number | null): string {
  if (v == null) return '—'
  return `₹${v.toLocaleString('en-IN')}`
}

export default function DealCard({
  deal,
  companyName,
  onClick,
}: {
  deal: Deal
  companyName?: string
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { deal },
  })

  const age = differenceInDays(new Date(), new Date(deal.created_at))

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 border-t-2 ${stageColors[deal.stage]} p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none ${isDragging ? 'opacity-50 ring-2 ring-brand-500' : ''}`}
    >
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{deal.name}</p>
      {companyName && (
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{companyName}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {formatValue(deal.value)}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {deal.expected_close_date
            ? format(new Date(deal.expected_close_date), 'MMM d')
            : `${age}d`}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${PIPELINE_BADGE[deal.pipeline]}`}
        >
          {PIPELINE_LABELS[deal.pipeline]}
        </span>
        {deal.owner && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[70px]">
            {deal.owner}
          </span>
        )}
      </div>
    </div>
  )
}

export { stageColors, PIPELINE_BADGE, formatValue }
