import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { Download } from 'lucide-react'

const ENTITY_FIELDS: Record<string, string[]> = {
  contacts: ['first_name', 'last_name', 'email', 'phone', 'company', 'title', 'city', 'state', 'country', 'source', 'status', 'created_at'],
  companies: ['name', 'industry', 'website', 'phone', 'email', 'address', 'city', 'state', 'country', 'pincode', 'employee_count', 'annual_revenue', 'created_at'],
  deals: ['title', 'value', 'stage', 'pipeline', 'probability', 'expected_close', 'currency', 'created_at'],
}

export default function ExportBuilder() {
  const { addToast } = useToast()
  const [entityType, setEntityType] = useState('contacts')
  const [selectedFields, setSelectedFields] = useState<string[]>(ENTITY_FIELDS.contacts)
  const [exporting, setExporting] = useState(false)

  function toggleField(field: string) {
    setSelectedFields((prev) => prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field])
  }

  function handleEntityChange(type: string) {
    setEntityType(type)
    setSelectedFields(ENTITY_FIELDS[type] ?? [])
  }

  async function runExport() {
    setExporting(true)
    const fields = selectedFields.join(',')
    const { data, error } = await supabase.from(entityType).select(fields).order('created_at', { ascending: false }).limit(10000)
    setExporting(false)
    if (error) { addToast(error.message, 'error'); return }
    if (!data || data.length === 0) { addToast('No data to export', 'error'); return }

    const csvHeaders = selectedFields.join(',')
    const csvRows = (data as unknown as Record<string, unknown>[]).map((row) =>
      selectedFields.map((f) => {
        const val = row[f]
        if (val == null) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    )
    const csv = [csvHeaders, ...csvRows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast(`Exported ${data.length} ${entityType}`, 'success')
  }

  const fields = ENTITY_FIELDS[entityType] ?? []

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Entity Type</label>
        <select value={entityType} onChange={(e) => handleEntityChange(e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm">
          <option value="contacts">Contacts</option>
          <option value="companies">Companies</option>
          <option value="deals">Deals</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fields to Export</label>
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <button key={f} onClick={() => toggleField(f)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              selectedFields.includes(f)
                ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400'
                : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
            }`}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <button onClick={runExport} disabled={exporting || selectedFields.length === 0} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
        <Download size={14} /> {exporting ? 'Exporting...' : `Export ${entityType}`}
      </button>
    </div>
  )
}
