import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CustomField, CustomFieldValue } from '../../lib/types'

interface CustomFieldRendererProps {
  entityType: 'contact' | 'company' | 'deal'
  entityId: number
}

export default function CustomFieldRenderer({ entityType, entityId }: CustomFieldRendererProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [values, setValues] = useState<Map<string, CustomFieldValue>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)

  async function fetchFieldsAndValues() {
    const [fieldsRes, valsRes] = await Promise.all([
      supabase.from('custom_fields').select('*').eq('entity_type', entityType).order('sort_order'),
      supabase.from('custom_field_values').select('*').eq('entity_type', entityType).eq('entity_id', entityId),
    ])
    setFields(fieldsRes.data ?? [])
    const map = new Map<string, CustomFieldValue>()
    for (const v of valsRes.data ?? []) map.set(v.custom_field_id, v)
    setValues(map)
  }

  useEffect(() => { fetchFieldsAndValues() }, [entityType, entityId])

  function getValue(field: CustomField): string {
    const v = values.get(field.id)
    if (!v) return ''
    if (field.field_type === 'number') return v.value_number?.toString() ?? ''
    if (field.field_type === 'date') return v.value_date ?? ''
    if (field.field_type === 'boolean') return v.value_text === 'true' ? 'true' : 'false'
    if (field.field_type === 'multiselect') return JSON.stringify(v.value_json ?? [])
    return v.value_text ?? ''
  }

  async function saveValue(field: CustomField, raw: string) {
    setSaving(field.id)
    const payload: Partial<CustomFieldValue> = {
      custom_field_id: field.id,
      entity_type: entityType,
      entity_id: entityId,
      value_text: null,
      value_number: null,
      value_date: null,
      value_json: null,
    }
    if (field.field_type === 'number') payload.value_number = raw ? parseFloat(raw) : null
    else if (field.field_type === 'date') payload.value_date = raw || null
    else if (field.field_type === 'boolean') payload.value_text = raw
    else if (field.field_type === 'multiselect') payload.value_json = JSON.parse(raw || '[]')
    else payload.value_text = raw || null

    await supabase.from('custom_field_values').upsert(payload, { onConflict: 'custom_field_id,entity_type,entity_id' })
    setSaving(null)
    fetchFieldsAndValues()
  }

  if (fields.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Custom Fields</h4>
      {fields.map((field) => {
        const val = getValue(field)
        return (
          <div key={field.id}>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{field.label}</label>
            {field.field_type === 'boolean' ? (
              <select value={val || 'false'} onChange={(e) => saveValue(field, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            ) : field.field_type === 'select' ? (
              <select value={val} onChange={(e) => saveValue(field, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Select —</option>
                {(field.options ?? []).map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'url' ? 'url' : field.field_type === 'email' ? 'email' : 'text'}
                defaultValue={val}
                onBlur={(e) => saveValue(field, e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
            {saving === field.id && <span className="text-xs text-slate-400 ml-1">Saving...</span>}
          </div>
        )
      })}
    </div>
  )
}
