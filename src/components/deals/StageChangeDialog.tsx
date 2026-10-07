import { useState } from 'react'
import type { DealStage } from '../../lib/types'
import Modal from '../ui/Modal'

export default function StageChangeDialog({
  dealName,
  stage,
  onConfirm,
  onCancel,
}: {
  dealName: string
  stage: DealStage
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  const isWon = stage === 'won'

  return (
    <Modal open onClose={onCancel} title={isWon ? 'Mark as Won' : 'Mark as Lost'}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isWon
            ? `Great news! Mark "${dealName}" as won?`
            : `Mark "${dealName}" as lost?`}
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {isWon ? 'Win reason' : 'Lost reason'}
          </label>
          <textarea
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isWon ? 'What sealed the deal?' : 'Why was this deal lost?'}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              isWon ? 'bg-brand-600 hover:bg-brand-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isWon ? 'Mark Won' : 'Mark Lost'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
