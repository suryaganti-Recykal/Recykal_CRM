import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import type { Webhook } from '../../lib/types'
import { Webhook as WebhookIcon, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

const EVENT_OPTIONS = [
  'contact.created', 'contact.updated', 'contact.deleted',
  'company.created', 'company.updated', 'company.deleted',
  'deal.created', 'deal.updated', 'deal.stage_changed', 'deal.won', 'deal.lost',
  'task.created', 'task.completed',
  'quote.sent', 'quote.accepted',
]

export default function WebhookSettings() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [hooks, setHooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])

  async function fetchHooks() {
    const { data } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false })
    setHooks(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchHooks() }, [])

  function toggleEvent(event: string) {
    setEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])
  }

  async function createWebhook() {
    if (!name.trim() || !url.trim() || events.length === 0) return
    const secret = crypto.randomUUID()
    const { error } = await supabase.from('webhooks').insert({
      name: name.trim(),
      url: url.trim(),
      events,
      secret,
      owner_id: profile?.id ?? null,
    })
    if (error) { addToast(error.message, 'error'); return }
    addToast('Webhook created', 'success')
    setName(''); setUrl(''); setEvents([]); setShowForm(false)
    fetchHooks()
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return
    await supabase.from('webhooks').delete().eq('id', id)
    fetchHooks()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('webhooks').update({ is_active: !active }).eq('id', id)
    fetchHooks()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Webhooks</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Send real-time events to external systems</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">
          <Plus size={14} /> Add Webhook
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <input type="text" placeholder="Webhook name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
          <input type="url" placeholder="https://your-endpoint.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Events</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <button key={ev} onClick={() => toggleEvent(ev)} className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  events.includes(ev)
                    ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400'
                    : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}>
                  {ev}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={createWebhook} disabled={!name.trim() || !url.trim() || events.length === 0} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      ) : hooks.length === 0 ? (
        <div className="text-center py-12">
          <WebhookIcon size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No webhooks configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {hooks.map((h) => (
            <div key={h.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-2">
                <WebhookIcon size={18} className={h.is_active ? 'text-green-500' : 'text-slate-400'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{h.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{h.url}</div>
                </div>
                <button onClick={() => toggleActive(h.id, h.is_active)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {h.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => deleteWebhook(h.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {h.events.map((ev) => (
                  <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{ev}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
