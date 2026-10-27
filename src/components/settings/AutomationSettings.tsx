import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import type { Automation, AutomationTrigger, AutomationAction } from '../../lib/types'
import { Plus, Trash2, Zap, ZapOff } from 'lucide-react'

const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: 'stage_change', label: 'Deal Stage Change' },
  { value: 'field_change', label: 'Field Changed' },
  { value: 'created', label: 'Record Created' },
  { value: 'time_based', label: 'Time-based' },
]
const ACTIONS: { value: AutomationAction; label: string }[] = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_field', label: 'Update Field' },
  { value: 'notify', label: 'Send Notification' },
  { value: 'assign_owner', label: 'Assign Owner' },
]

export default function AutomationSettings() {
  const { addToast } = useToast()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [entityType, setEntityType] = useState<'contact' | 'deal' | 'company'>('deal')
  const [triggerType, setTriggerType] = useState<AutomationTrigger>('stage_change')
  const [actionType, setActionType] = useState<AutomationAction>('notify')
  const [saving, setSaving] = useState(false)

  async function fetchAutomations() {
    const { data } = await supabase.from('automations').select('*').order('created_at', { ascending: false })
    setAutomations(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAutomations() }, [])

  async function handleCreate() {
    if (!name.trim()) { addToast('Name is required', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('automations').insert({
      name: name.trim(), entity_type: entityType, trigger_type: triggerType, action_type: actionType,
    })
    if (error) addToast(error.message, 'error')
    else { addToast('Automation created', 'success'); setShowForm(false); setName('') }
    setSaving(false); fetchAutomations()
  }

  async function toggleActive(a: Automation) {
    await supabase.from('automations').update({ is_active: !a.is_active }).eq('id', a.id)
    fetchAutomations()
  }

  async function deleteAutomation(id: string) {
    if (!confirm('Delete this automation?')) return
    await supabase.from('automations').delete().eq('id', id)
    fetchAutomations()
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Automations</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create workflow rules that trigger actions automatically.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus size={16} /> New Automation
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Notify on deal won" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Entity</label>
              <select value={entityType} onChange={(e) => setEntityType(e.target.value as 'contact' | 'deal' | 'company')} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="deal">Deal</option>
                <option value="contact">Contact</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Trigger</label>
              <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as AutomationTrigger)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Action</label>
              <select value={actionType} onChange={(e) => setActionType(e.target.value as AutomationAction)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Create'}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      {automations.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No automations yet.</p>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <div key={a.id} className={`border rounded-lg p-4 flex items-center justify-between ${a.is_active ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'}`}>
              <div className="flex items-center gap-3">
                {a.is_active ? <Zap size={18} className="text-amber-500" /> : <ZapOff size={18} className="text-slate-400" />}
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    When <span className="font-medium">{a.entity_type}</span> {a.trigger_type.replace('_', ' ')} → {a.action_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(a)} className={`text-xs font-medium px-2.5 py-1 rounded ${a.is_active ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>{a.is_active ? 'Active' : 'Paused'}</button>
                <button onClick={() => deleteAutomation(a.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
