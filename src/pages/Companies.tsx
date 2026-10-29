import { Fragment, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CompanyCustomerType, CompanyOverview, CompanyStatus, CompanyVertical } from '../lib/types'
import {
  COMPANY_CUSTOMER_TYPES,
  COMPANY_CUSTOMER_TYPE_LABELS,
  COMPANY_STATUS_LABELS,
  COMPANY_VERTICALS,
} from '../lib/types'
import { format } from 'date-fns'
import { Plus, Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react'
import Modal from '../components/ui/Modal'

const PAGE_SIZE = 100

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

const VERTICAL_STYLES: Record<CompanyVertical, string> = {
  EPR: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Marketplace: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Re-commerce': 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  DRS: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}

const STATUS_STYLES: Record<CompanyStatus, string> = {
  has_deals: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  contacts_only: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  no_contacts_no_deals: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

interface NewCompany {
  name: string
  website: string
  industry: string
  gst: string
  employees_range: string
  annual_turnover: string
  city: string
  state: string
  customer_type: CompanyCustomerType | ''
  tag: string
  account_owners: string
}

const emptyForm: NewCompany = {
  name: '',
  website: '',
  industry: '',
  gst: '',
  employees_range: '',
  annual_turnover: '',
  city: '',
  state: '',
  customer_type: '',
  tag: '',
  account_owners: '',
}

export default function Companies() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<CompanyOverview[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [vertical, setVertical] = useState<CompanyVertical | ''>('')
  const [status, setStatus] = useState<CompanyStatus | ''>('')
  const [stateFilter, setStateFilter] = useState('')
  const [stateOptions, setStateOptions] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewCompany>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const filtersActive = !!(vertical || status || stateFilter || search.trim())

  useEffect(() => {
    supabase
      .from('cpcb_company_overview')
      .select('state')
      .not('state', 'is', null)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set((data as { state: string }[]).map((r) => r.state))].sort()
          setStateOptions(unique)
        }
      })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('cpcb_company_overview')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to)

    const term = search.trim()
    if (term) {
      query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,tag.ilike.%${term}%`)
    }
    if (vertical) query = query.eq('vertical', vertical)
    if (status) query = query.eq('status', status)
    if (stateFilter) query = query.eq('state', stateFilter)

    const { data, count, error } = await query
    if (!error && data) {
      setCompanies(data as CompanyOverview[])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [page, search, vertical, status, stateFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      setSearch(searchInput)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(0)
  }, [vertical, status, stateFilter])

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setVertical('')
    setStatus('')
    setStateFilter('')
    setPage(0)
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('companies').insert({
      name: form.name,
      website: form.website || null,
      industry: form.industry || null,
      gst: form.gst || null,
      employees_range: form.employees_range || null,
      annual_turnover: form.annual_turnover || null,
      city: form.city || null,
      state: form.state || null,
      customer_type: form.customer_type || null,
      tag: form.tag || null,
      account_owners: form.account_owners || null,
    })
    setSaving(false)
    if (!error) {
      setModalOpen(false)
      setForm(emptyForm)
      load()
    }
  }

  const rangeStart = page * PAGE_SIZE + 1
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalCount)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Companies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {totalCount === 0 ? 'No companies match' : `${rangeStart}–${rangeEnd} of ${totalCount.toLocaleString()} companies`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, city, state, tag…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select className={inputCls} value={vertical} onChange={(e) => setVertical(e.target.value as CompanyVertical | '')}>
          <option value="">All verticals</option>
          {COMPANY_VERTICALS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as CompanyStatus | '')}>
          <option value="">All statuses</option>
          {(Object.keys(COMPANY_STATUS_LABELS) as CompanyStatus[]).map((s) => (
            <option key={s} value={s}>{COMPANY_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <select className={inputCls} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All states</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {filtersActive && (
            <button
              onClick={clearFilters}
              className="shrink-0 flex items-center gap-1 px-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Clear all filters"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Vertical</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Contacts</th>
              <th className="px-4 py-3 font-medium text-right">Deals</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Tag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Loading…</td></tr>
            )}
            {!loading && companies.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No companies match these filters.</td></tr>
            )}
            {!loading && companies.map((c) => (
              <Fragment key={c.id}>
                <tr
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/companies/${c.id}`) }}
                      className="flex items-center gap-2 hover:text-brand-700 dark:hover:text-brand-400 hover:underline"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="truncate max-w-[300px]">{c.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {c.vertical ? (
                      <span className={`inline-block text-xs rounded-full px-2 py-0.5 ${VERTICAL_STYLES[c.vertical]}`}>{c.vertical}</span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs rounded-full px-2 py-0.5 ${STATUS_STYLES[c.status]}`}>
                      {COMPANY_STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.contact_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.deal_count}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.state || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {c.tag ? (
                      <span className="inline-block max-w-[160px] truncate text-xs rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5">
                        {c.tag}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr className="bg-slate-50 dark:bg-slate-800/30">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Website</p>
                          <p className="text-slate-700 dark:text-slate-300">{c.website || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Domain</p>
                          <p className="text-slate-700 dark:text-slate-300">{c.domain || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">First contact</p>
                          <p className="text-slate-700 dark:text-slate-300">
                            {c.first_contact_at ? format(new Date(c.first_contact_at), 'MMM d, yyyy') : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Data completeness</p>
                          <p className="text-slate-700 dark:text-slate-300">{c.data_fields_filled} of 4 fields</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Company">
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Company Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Industry</label>
              <input className={inputCls} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>GST</label>
              <input className={inputCls} value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Employees</label>
              <input className={inputCls} value={form.employees_range} onChange={(e) => setForm({ ...form, employees_range: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Annual Turnover</label>
              <input className={inputCls} value={form.annual_turnover} onChange={(e) => setForm({ ...form, annual_turnover: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Customer Type</label>
              <select
                className={inputCls}
                value={form.customer_type}
                onChange={(e) => setForm({ ...form, customer_type: e.target.value as CompanyCustomerType | '' })}
              >
                <option value="">— Not set —</option>
                {COMPANY_CUSTOMER_TYPES.map((t) => (
                  <option key={t} value={t}>{COMPANY_CUSTOMER_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tag</label>
              <input className={inputCls} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Plastic Recycler" />
            </div>
            <div>
              <label className={labelCls}>Account Owners</label>
              <input className={inputCls} value={form.account_owners} onChange={(e) => setForm({ ...form, account_owners: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add Company'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
