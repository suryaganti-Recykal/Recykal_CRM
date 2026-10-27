import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import type { EmailTemplate, EmailTemplateCategory } from '../../lib/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const CATEGORIES: { value: EmailTemplateCategory; label: string }[] = [
  { value: 'intro', label: 'Introduction' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'closing', label: 'Closing' },
  { value: 'general', label: 'General' },
]

export default function EmailTemplateSettings() {
  const { addToast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [category, setCategory] = useState<EmailTemplateCategory>('general')
  const [saving, setSaving] = useState(false)

  async function fetchTemplates() {
    const { data } = await supabase.from('email_templates').select('*').order('name')
    setTemplates(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  function openCreate() {
    setEditing(null); setName(''); setSubject(''); setBodyHtml(''); setCategory('general'); setShowForm(true)
  }

  function openEdit(t: EmailTemplate) {
    setEditing(t); setName(t.name); setSubject(t.subject ?? ''); setBodyHtml(t.body_html ?? ''); setCategory(t.category ?? 'general'); setShowForm(true)
  }

  async function handleSave() {
    if (!name.trim()) { addToast('Name is required', 'error'); return }
    setSaving(true)
    const payload = { name: name.trim(), subject: subject.trim() || null, body_html: bodyHtml.trim() || null, category }
    if (editing) {
      const { error } = await supabase.from('email_templates').update(payload).eq('id', editing.id)
      if (error) addToast(error.message, 'error'); else addToast('Template updated', 'success')
    } else {
      const { error } = await supabase.from('email_templates').insert(payload)
      if (error) addToast(error.message, 'error'); else addToast('Template created', 'success')
    }
    setSaving(false); setShowForm(false); fetchTemplates()
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await supabase.from('email_templates').delete().eq('id', id)
    fetchTemplates()
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Templates</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create reusable email templates. Use {'{{contact.name}}'}, {'{{company.name}}'} as merge fields.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus size={16} /> New Template
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as EmailTemplateCategory)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Re: {{contact.name}} — Follow-up" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Body (HTML)</label>
            <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={8} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No templates yet.</p>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Category</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">{t.subject ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{t.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Pencil size={14} /></button>
                      <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
