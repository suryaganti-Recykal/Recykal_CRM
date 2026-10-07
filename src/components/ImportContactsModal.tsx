import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'
import { LEADS_SOURCES, LEADS_SOURCE_LABELS, type LeadsSource } from '../lib/types'
import Modal from './ui/Modal'
import { Upload, ArrowRight, ArrowLeft as ArrowLeftIcon, CheckCircle2 } from 'lucide-react'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done'

interface TargetField {
  key: string
  label: string
  required?: boolean
}

const TARGET_FIELDS: TargetField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'region', label: 'Region' },
  { key: 'category', label: 'Category' },
  { key: 'need_help_with', label: 'Need Help With' },
  { key: 'requirement_description', label: 'Requirement / Notes' },
  { key: 'tag', label: 'Tag' },
  { key: 'mobile_number', label: 'Mobile Number' },
]

function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
  for (const field of TARGET_FIELDS) {
    const fieldNorm = normalize(field.label)
    const match = headers.find((h) => {
      const hNorm = normalize(h)
      return hNorm === fieldNorm || hNorm.includes(fieldNorm) || fieldNorm.includes(hNorm)
    })
    if (match) mapping[field.key] = match
  }
  return mapping
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export default function ImportContactsModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [leadsSource, setLeadsSource] = useState<LeadsSource | ''>('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [result, setResult] = useState<{ inserted: number; updated: number; skipped: number; failed: number; error: string | null } | null>(null)

  function reset() {
    setStep('upload')
    setHeaders([])
    setRows([])
    setMapping({})
    setLeadsSource('')
    setFileError(null)
    setResult(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(file: File) {
    setFileError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.meta.fields || res.meta.fields.length === 0) {
          setFileError('Could not detect any columns in this file.')
          return
        }
        if (res.data.length === 0) {
          setFileError('This file has no data rows.')
          return
        }
        setHeaders(res.meta.fields)
        setRows(res.data)
        setMapping(guessMapping(res.meta.fields))
        setStep('map')
      },
      error: (err) => setFileError(err.message),
    })
  }

  async function handleImport() {
    setStep('importing')

    const mappedRows = rows
      .map((row) => {
        const obj: Record<string, string | null> = {}
        for (const field of TARGET_FIELDS) {
          const sourceCol = mapping[field.key]
          obj[field.key] = sourceCol ? (row[sourceCol]?.trim() || null) : null
        }
        return obj
      })
      .filter((r) => r.email && EMAIL_RE.test(r.email))

    const emails = mappedRows.map((r) => (r.email as string).toLowerCase())
    const { data: existing } = await supabase.from('contacts').select('id, email').in('email', [...new Set(mappedRows.map((r) => r.email as string))])
    const existingByEmail = new Map<string, number>()
    for (const e of existing ?? []) {
      if (e.email) existingByEmail.set(e.email.toLowerCase(), e.id)
    }

    const toInsert: Record<string, unknown>[] = []
    const toUpdate: { id: number; payload: Record<string, unknown> }[] = []

    for (let i = 0; i < mappedRows.length; i++) {
      const r = mappedRows[i]
      const payload: Record<string, unknown> = {
        name: r.name,
        email: r.email,
        phone: r.phone,
        company_name: r.company_name,
        job_title: r.job_title,
        city: r.city,
        state: r.state,
        region: r.region,
        category: r.category,
        need_help_with: r.need_help_with,
        requirement_description: r.requirement_description,
        tag: r.tag,
        mobile_number: r.mobile_number,
        leads_source: leadsSource || null,
      }
      const existingId = existingByEmail.get(emails[i])
      if (existingId) {
        toUpdate.push({ id: existingId, payload })
      } else {
        toInsert.push({
          ...payload,
          source: 'csv_import',
          lifecycle_stage: 'lead',
          contact_status: 'mql_not_contacted',
        })
      }
    }

    let insertedCount = 0
    let failedCount = 0
    let firstError: string | null = null

    if (toInsert.length > 0) {
      const { error, data } = await supabase.from('contacts').insert(toInsert).select('id')
      if (error) {
        failedCount += toInsert.length
        firstError = error.message
      } else {
        insertedCount = data?.length ?? 0
      }
    }

    let updatedCount = 0
    for (const u of toUpdate) {
      const { error } = await supabase.from('contacts').update(u.payload).eq('id', u.id)
      if (error) {
        failedCount += 1
        firstError = firstError ?? error.message
      } else {
        updatedCount += 1
      }
    }

    setResult({
      inserted: insertedCount,
      updated: updatedCount,
      skipped: rows.length - mappedRows.length,
      failed: failedCount,
      error: firstError,
    })
    setStep('done')
    onImported()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Contacts">
      {step === 'upload' && (
        <div>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-10 cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 transition-colors">
            <Upload size={24} className="text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Click to choose a CSV file</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">Google Ads / Facebook Ads / HubSpot exports all work</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>
          {fileError && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{fileError}</p>}
        </div>
      )}

      {step === 'map' && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {rows.length} rows detected. Map your columns to CRM fields — unmapped fields are left blank.
          </p>
          <div className="mb-4">
            <label className={labelCls}>Lead Source (applied to all imported rows)</label>
            <select className={inputCls} value={leadsSource} onChange={(e) => setLeadsSource(e.target.value as LeadsSource | '')}>
              <option value="">— Not set —</option>
              {LEADS_SOURCES.map((s) => (
                <option key={s} value={s}>{LEADS_SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {TARGET_FIELDS.map((field) => (
              <div key={field.key} className="grid grid-cols-2 gap-3 items-center">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  {field.label}{field.required && <span className="text-red-500"> *</span>}
                </label>
                <select
                  className={inputCls}
                  value={mapping[field.key] ?? ''}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                >
                  <option value="">— Not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep('upload')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeftIcon size={14} />
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!mapping.name || !mapping.email}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              Preview
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Preview of the first 5 rows as they'll be imported:</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                    <th key={f.key} className="px-2 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <td key={f.key} className="px-2 py-2 text-slate-700 dark:text-slate-300">{row[mapping[f.key]] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Rows with a missing or invalid email will be skipped. Existing contacts (matched by email) will be updated; new emails will be created.
          </p>
          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep('map')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeftIcon size={14} />
              Back
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
            >
              Import {rows.length} Rows
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-10 text-center text-slate-400 dark:text-slate-500">Importing…</div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-4">
          <CheckCircle2 size={40} className={result.failed > 0 ? 'text-amber-500 mx-auto mb-3' : 'text-brand-500 mx-auto mb-3'} />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
            {result.failed > 0 ? 'Import finished with errors' : 'Import complete'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {result.inserted} created · {result.updated} updated
            {result.skipped > 0 && ` · ${result.skipped} skipped (missing/invalid email)`}
            {result.failed > 0 && ` · ${result.failed} failed`}
          </p>
          {result.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">{result.error}</p>
          )}
          <button
            onClick={handleClose}
            className="mt-5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  )
}
