import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { Company, Deal, DealStage } from '../../lib/types'
import { DEAL_STAGES } from '../../lib/types'
import KanbanColumn from './KanbanColumn'
import DealCard from './DealCard'
import StageChangeDialog from './StageChangeDialog'

export default function KanbanBoard({
  dealsByStage,
  companyById,
  onCardClick,
  onQuickAdd,
  onStageChange,
  allDeals,
}: {
  dealsByStage: Map<DealStage, Deal[]>
  companyById: Map<number, Company>
  onCardClick: (deal: Deal) => void
  onQuickAdd: (stage: DealStage) => void
  onStageChange: (dealId: number, stage: DealStage, extra?: Partial<Deal>) => void
  allDeals: Deal[]
}) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [pendingMove, setPendingMove] = useState<{ deal: Deal; stage: DealStage } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const deal = allDeals.find((d) => d.id === event.active.id)
      setActiveDeal(deal ?? null)
    },
    [allDeals]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDeal(null)
      const { active, over } = event
      if (!over) return

      const dealId = active.id as number
      const deal = allDeals.find((d) => d.id === dealId)
      if (!deal) return

      let targetStage: DealStage
      if (DEAL_STAGES.includes(over.id as DealStage)) {
        targetStage = over.id as DealStage
      } else {
        const overDeal = allDeals.find((d) => d.id === over.id)
        if (!overDeal) return
        targetStage = overDeal.stage
      }

      if (targetStage === deal.stage) return

      if (targetStage === 'won' || targetStage === 'lost') {
        setPendingMove({ deal, stage: targetStage })
      } else {
        onStageChange(dealId, targetStage)
      }
    },
    [allDeals, onStageChange]
  )

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
          {DEAL_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={dealsByStage.get(stage) ?? []}
              companyById={companyById}
              onCardClick={onCardClick}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal && (
            <div className="w-[200px] rotate-2 opacity-90">
              <DealCard
                deal={activeDeal}
                companyName={
                  activeDeal.company_id != null
                    ? companyById.get(activeDeal.company_id)?.name
                    : undefined
                }
                onClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {pendingMove && (
        <StageChangeDialog
          dealName={pendingMove.deal.name}
          stage={pendingMove.stage}
          onConfirm={(reason) => {
            const extra =
              pendingMove.stage === 'won'
                ? { closed_won_reason: reason }
                : { closed_lost_reason: reason }
            onStageChange(pendingMove.deal.id, pendingMove.stage, extra)
            setPendingMove(null)
          }}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </>
  )
}
