import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import { CALL_OUTCOMES, CALL_OUTCOME_LABELS } from '../../lib/types'
import type { CallOutcome } from '../../lib/types'

interface CallLogFormProps {
  contactId?: number
  dealId?: number
  onSaved: () => void
  onCancel: () => void
}

export default function CallLogForm({ contactId, dealId, onSaved, onCancel }: CallLogFormProps) {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound')
  const [outcome, setOutcome] = useState<CallOutcome>('connected')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('call_logs').insert({
      contact_id: contactId ?? null,
      deal_id: dealId ?? null,
      caller_id: profile?.id ?? null,
      direction,
      outcome,
      duration_seconds: duration ? parseInt(duration) * 60 : null,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (error) addToast(error.message, 'error')
    else { addToast('Call logged', 'success'); onSaved() }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Log a Call</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Direction</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as 'inbound' | 'outbound')} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value as CallOutcome)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{CALL_OUTCOME_LABELS[o]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duration (minutes)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="5" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Log Call'}</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
      </div>
    </div>
  )
}
