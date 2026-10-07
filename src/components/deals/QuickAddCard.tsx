import { useRef, useState } from 'react'
import type { Company, DealStage } from '../../lib/types'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'

export default function QuickAddCard({
  stage,
  companies,
  onAdd,
  onClose,
}: {
  stage: DealStage
  companies: Company[]
  onAdd: (data: { name: string; company_id: number | null; value: number | null; stage: DealStage }) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [value, setValue] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  function submit() {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      company_id: companyId ? Number(companyId) : null,
      value: value ? Number(value) : null,
      stage,
    })
    setName('')
    setCompanyId('')
    setValue('')
    nameRef.current?.focus()
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-brand-300 dark:border-brand-700 p-3 shadow-md space-y-2">
      <input
        ref={nameRef}
        autoFocus
        placeholder="Deal name"
        className={inputCls}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
      />
      <select
        className={inputCls}
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
      >
        <option value="">Company (optional)</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Value (₹)"
        className={inputCls}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="flex-1 text-sm font-medium rounded-lg bg-brand-600 text-white py-1.5 hover:bg-brand-700 disabled:opacity-60"
        >
          Add
        </button>
        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
