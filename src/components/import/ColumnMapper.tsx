import { useMemo } from 'react'

interface ColumnMapperProps {
  headers: string[]
  mapping: Record<string, string>
  onChange: (mapping: Record<string, string>) => void
  entityType: string
}

const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  contacts: [
    { value: '', label: '— Skip —' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company_name', label: 'Company' },
    { value: 'title', label: 'Title / Designation' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'country', label: 'Country' },
    { value: 'source', label: 'Source' },
    { value: 'status', label: 'Status' },
    { value: 'notes', label: 'Notes' },
    { value: 'linkedin_url', label: 'LinkedIn URL' },
    { value: 'secondary_email', label: 'Secondary Email' },
    { value: 'secondary_phone', label: 'Secondary Phone' },
  ],
  companies: [
    { value: '', label: '— Skip —' },
    { value: 'name', label: 'Company Name' },
    { value: 'industry', label: 'Industry' },
    { value: 'website', label: 'Website' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'address', label: 'Address' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'country', label: 'Country' },
    { value: 'pincode', label: 'Pincode' },
    { value: 'employee_count', label: 'Employee Count' },
    { value: 'annual_revenue', label: 'Annual Revenue' },
    { value: 'notes', label: 'Notes' },
  ],
  deals: [
    { value: '', label: '— Skip —' },
    { value: 'title', label: 'Deal Title' },
    { value: 'value', label: 'Value' },
    { value: 'stage', label: 'Stage' },
    { value: 'pipeline', label: 'Pipeline' },
    { value: 'probability', label: 'Probability (%)' },
    { value: 'expected_close', label: 'Expected Close Date' },
    { value: 'company_name', label: 'Company' },
    { value: 'contact_name', label: 'Contact' },
    { value: 'currency', label: 'Currency' },
    { value: 'notes', label: 'Notes' },
  ],
}

function guessField(header: string, entityType: string): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '')
  const options = FIELD_OPTIONS[entityType] ?? []
  for (const opt of options) {
    if (!opt.value) continue
    const v = opt.value.replace(/_/g, '')
    if (h === v || h.includes(v) || v.includes(h)) return opt.value
  }
  if (h.includes('name') && !h.includes('first') && !h.includes('last') && !h.includes('company')) {
    if (entityType === 'companies') return 'name'
    if (entityType === 'deals') return 'title'
  }
  if (h.includes('firstname') || h === 'first') return 'first_name'
  if (h.includes('lastname') || h === 'last') return 'last_name'
  if (h.includes('mail') || h.includes('email')) return 'email'
  if (h.includes('phone') || h.includes('mobile') || h.includes('tel')) return 'phone'
  return ''
}

export default function ColumnMapper({ headers, mapping, onChange, entityType }: ColumnMapperProps) {
  const fields = useMemo(() => FIELD_OPTIONS[entityType] ?? FIELD_OPTIONS.contacts, [entityType])

  const autoMapping = useMemo(() => {
    if (Object.keys(mapping).length > 0) return mapping
    const auto: Record<string, string> = {}
    for (const h of headers) auto[h] = guessField(h, entityType)
    return auto
  }, [headers, entityType])

  const current = Object.keys(mapping).length > 0 ? mapping : autoMapping

  function handleChange(header: string, value: string) {
    onChange({ ...current, [header]: value })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">Map CSV columns to CRM fields. Unmapped columns will be skipped.</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="font-semibold text-slate-600 dark:text-slate-400 py-1">CSV Column</div>
        <div className="font-semibold text-slate-600 dark:text-slate-400 py-1">CRM Field</div>
        {headers.map((h) => (
          <div key={h} className="contents">
            <div className="py-2 text-slate-900 dark:text-slate-100 truncate" title={h}>{h}</div>
            <select
              value={current[h] ?? ''}
              onChange={(e) => handleChange(h, e.target.value)}
              className="py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
            >
              {fields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export { FIELD_OPTIONS }
