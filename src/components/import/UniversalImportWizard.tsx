import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import ColumnMapper from './ColumnMapper'
import { Upload, FileUp, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done'

interface ImportResult {
  created: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
      current += ch
    }
    values.push(current.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
  return { headers, rows }
}

export default function UniversalImportWizard() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [entityType, setEntityType] = useState<string>('contacts')
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const { headers: h, rows: r } = parseCSV(ev.target?.result as string)
      setHeaders(h)
      setRows(r)
      setMapping({})
      setStep('map')
    }
    reader.readAsText(file)
  }

  async function runImport() {
    setStep('importing')
    const importResult: ImportResult = { created: 0, updated: 0, skipped: 0, failed: 0, errors: [] }

    const { data: job } = await supabase.from('import_jobs').insert({
      entity_type: entityType,
      file_name: fileName,
      total_rows: rows.length,
      status: 'processing',
      column_mapping: mapping,
      started_by: profile?.id ?? null,
    }).select().single()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const mapped: Record<string, unknown> = {}
      for (const [csvCol, crmField] of Object.entries(mapping)) {
        if (!crmField || !row[csvCol]) continue
        mapped[crmField] = row[csvCol]
      }

      if (Object.keys(mapped).length === 0) { importResult.skipped++; continue }

      try {
        if (entityType === 'contacts') {
          const record: Record<string, unknown> = {}
          if (mapped.first_name) record.first_name = mapped.first_name
          if (mapped.last_name) record.last_name = mapped.last_name
          if (mapped.email) record.email = mapped.email
          if (mapped.phone) record.phone = mapped.phone
          if (mapped.company_name) record.company = mapped.company_name
          if (mapped.title) record.title = mapped.title
          if (mapped.city) record.city = mapped.city
          if (mapped.state) record.state = mapped.state
          if (mapped.country) record.country = mapped.country
          if (mapped.source) record.source = mapped.source
          if (mapped.status) record.status = mapped.status
          if (mapped.notes) record.notes = mapped.notes
          if (mapped.linkedin_url) record.linkedin_url = mapped.linkedin_url
          if (mapped.secondary_email) record.secondary_email = mapped.secondary_email
          if (mapped.secondary_phone) record.secondary_phone = mapped.secondary_phone
          const { error } = await supabase.from('contacts').insert(record)
          if (error) throw error
          importResult.created++
        } else if (entityType === 'companies') {
          const record: Record<string, unknown> = {}
          if (mapped.name) record.name = mapped.name
          if (mapped.industry) record.industry = mapped.industry
          if (mapped.website) record.website = mapped.website
          if (mapped.phone) record.phone = mapped.phone
          if (mapped.email) record.email = mapped.email
          if (mapped.address) record.address = mapped.address
          if (mapped.city) record.city = mapped.city
          if (mapped.state) record.state = mapped.state
          if (mapped.country) record.country = mapped.country
          if (mapped.pincode) record.pincode = mapped.pincode
          if (mapped.employee_count) record.employee_count = parseInt(mapped.employee_count as string) || null
          if (mapped.annual_revenue) record.annual_revenue = parseFloat(mapped.annual_revenue as string) || null
          if (mapped.notes) record.notes = mapped.notes
          const { error } = await supabase.from('companies').insert(record)
          if (error) throw error
          importResult.created++
        } else if (entityType === 'deals') {
          const record: Record<string, unknown> = {}
          if (mapped.title) record.title = mapped.title
          if (mapped.value) record.value = parseFloat(mapped.value as string) || 0
          if (mapped.stage) record.stage = mapped.stage
          if (mapped.pipeline) record.pipeline = mapped.pipeline
          if (mapped.probability) record.probability = parseInt(mapped.probability as string) || null
          if (mapped.expected_close) record.expected_close = mapped.expected_close
          if (mapped.currency) record.currency = mapped.currency
          if (mapped.notes) record.notes = mapped.notes
          const { error } = await supabase.from('deals').insert(record)
          if (error) throw error
          importResult.created++
        }
      } catch (err: unknown) {
        importResult.failed++
        const msg = err instanceof Error ? err.message : String(err)
        if (importResult.errors.length < 20) importResult.errors.push(`Row ${i + 2}: ${msg}`)
      }
    }

    if (job) {
      await supabase.from('import_jobs').update({
        status: importResult.failed > 0 && importResult.created === 0 ? 'failed' : 'completed',
        created_count: importResult.created,
        updated_count: importResult.updated,
        skipped_count: importResult.skipped,
        failed_count: importResult.failed,
        error_log: importResult.errors,
        completed_at: new Date().toISOString(),
      }).eq('id', job.id)
    }

    setResult(importResult)
    setStep('done')
    addToast(`Import complete: ${importResult.created} created, ${importResult.failed} failed`, importResult.failed > 0 ? 'error' : 'success')
  }

  function reset() {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({})
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const mappedFieldCount = Object.values(mapping).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Entity Selector */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">What are you importing?</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm">
              <option value="contacts">Contacts</option>
              <option value="companies">Companies</option>
              <option value="deals">Deals</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-brand-500 dark:hover:border-brand-400 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
            <FileUp size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload CSV file</p>
            <p className="text-xs text-slate-400 mt-1">Supports .csv files up to 10MB</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        </div>
      )}

      {/* Column Mapping */}
      {step === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Map Columns</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{fileName} — {rows.length} rows, {headers.length} columns</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{mappedFieldCount} field{mappedFieldCount !== 1 ? 's' : ''} mapped</span>
          </div>

          <ColumnMapper headers={headers} mapping={mapping} onChange={setMapping} entityType={entityType} />

          <div className="flex gap-3 pt-4">
            <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={() => setStep('preview')} disabled={mappedFieldCount === 0} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Preview <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Preview (first 5 rows)</h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {Object.entries(mapping).filter(([, v]) => v).map(([csvCol, crmField]) => (
                    <th key={csvCol} className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {crmField} <span className="font-normal text-slate-400">({csvCol})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {Object.entries(mapping).filter(([, v]) => v).map(([csvCol]) => (
                      <td key={csvCol} className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-48 truncate">{row[csvCol] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ready to import <strong>{rows.length}</strong> {entityType} with <strong>{mappedFieldCount}</strong> mapped fields.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={runImport} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Upload size={14} /> Start Import
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {step === 'importing' && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Importing {rows.length} {entityType}...</p>
        </div>
      )}

      {/* Done */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="text-center py-6">
            {result.failed === 0 ? (
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            ) : (
              <AlertCircle size={48} className="mx-auto text-amber-500 mb-3" />
            )}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Import Complete</h3>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{result.created}</div>
              <div className="text-xs text-green-600 dark:text-green-500">Created</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{result.updated}</div>
              <div className="text-xs text-blue-600 dark:text-blue-500">Updated</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{result.skipped}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500">Skipped</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{result.failed}</div>
              <div className="text-xs text-red-600 dark:text-red-500">Failed</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Errors</h4>
              <ul className="space-y-1 text-xs text-red-600 dark:text-red-400 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <button onClick={reset} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Import Another File</button>
        </div>
      )}
    </div>
  )
}
