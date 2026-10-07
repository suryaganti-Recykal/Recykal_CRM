import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Company, Deal, DealStage } from '../../lib/types'
import { DEAL_STAGE_LABELS } from '../../lib/types'
import DealCard from './DealCard'
import { formatValue } from './DealCard'

export default function KanbanColumn({
  stage,
  deals,
  companyById,
  onCardClick,
  onQuickAdd,
}: {
  stage: DealStage
  deals: Deal[]
  companyById: Map<number, Company>
  onCardClick: (deal: Deal) => void
  onQuickAdd: (stage: DealStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const colValue = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[220px] w-[220px] shrink-0 rounded-xl transition-colors ${
        isOver ? 'bg-brand-50/50 dark:bg-brand-500/5' : 'bg-slate-50/70 dark:bg-slate-800/30'
      }`}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
            {DEAL_STAGE_LABELS[stage]}
          </h3>
          <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500 ml-1">{deals.length}</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
          {formatValue(colValue)}
        </p>
      </div>

      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
          {deals.map((d) => (
            <DealCard
              key={d.id}
              deal={d}
              companyName={d.company_id != null ? companyById.get(d.company_id)?.name : undefined}
              onClick={() => onCardClick(d)}
            />
          ))}
          {deals.length === 0 && (
            <div className="text-xs text-slate-300 dark:text-slate-600 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              No deals
            </div>
          )}
        </div>
      </SortableContext>

      <button
        onClick={() => onQuickAdd(stage)}
        className="mx-2 mb-2 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 py-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
      >
        <Plus size={14} />
        Add
      </button>
    </div>
  )
}
