import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import type { CustomField, CustomFieldType } from '../../lib/types'
import { CUSTOM_FIELD_TYPES } from '../../lib/types'
import { Plus, Trash2, GripVertical } from 'lucide-react'

const ENTITY_TYPES = ['contact', 'company', 'deal'] as const

export default function CustomFieldSettings() {
  const { addToast } = useToast()
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'contact' | 'company' | 'deal'>('contact')
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState<CustomFieldType>('text')
  const [options, setOptions] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchFields() {
    const { data } = await supabase.from('custom_fields').select('*').order('sort_order')
    setFields(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchFields() }, [])

  const filtered = fields.filter((f) => f.entity_type === activeTab)

  async function handleCreate() {
    if (!label.trim()) { addToast('Label is required', 'error'); return }
    setSaving(true)
    const fieldName = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const payload: Partial<CustomField> = {
      entity_type: activeTab,
      field_name: fieldName,
      label: label.trim(),
      field_type: fieldType,
      options: (fieldType === 'select' || fieldType === 'multiselect') ? options.split(',').map((s) => s.trim()).filter(Boolean) : null,
      sort_order: filtered.length,
    }
    const { error } = await supabase.from('custom_fields').insert(payload)
    if (error) addToast(error.message, 'error')
    else { addToast('Field created', 'success'); setShowForm(false); setLabel(''); setFieldType('text'); setOptions('') }
    setSaving(false); fetchFields()
  }

  async function deleteField(id: string) {
    if (!confirm('Delete this custom field? All stored values will be lost.')) return
    const { error } = await supabase.from('custom_fields').delete().eq('id', id)
    if (error) addToast(error.message, 'error'); else fetchFields()
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Custom Fields</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add custom fields to contacts, companies, and deals.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {ENTITY_TYPES.map((et) => (
          <button key={et} onClick={() => setActiveTab(et)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === et ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            {et.charAt(0).toUpperCase() + et.slice(1)}s
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="w-8 px-2 py-3" />
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Label</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Options</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-2 py-3 text-slate-400"><GripVertical size={14} /></td>
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{f.label}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">{f.field_type}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs truncate max-w-xs">{f.options?.join(', ') ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteField(f.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"><Plus size={16} /> Add Custom Field</button>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Label *</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. PAN Number" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value as CustomFieldType)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CUSTOM_FIELD_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            {(fieldType === 'select' || fieldType === 'multiselect') && (
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Options (comma-separated)</label>
                <input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Option A, Option B" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Create Field'}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
