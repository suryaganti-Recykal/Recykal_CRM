import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Company, Deal, Contact, CompanyCustomerType } from '../lib/types'
import { COMPANY_CUSTOMER_TYPES, COMPANY_CUSTOMER_TYPE_LABELS } from '../lib/types'
import { format } from 'date-fns'
import { Plus, Building2 } from 'lucide-react'
import Modal from '../components/ui/Modal'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

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
  const [companies, setCompanies] = useState<Company[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewCompany>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [companiesRes, dealsRes, contactsRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('deals').select('*'),
      supabase.from('contacts').select('*'),
    ])
    if (!companiesRes.error && companiesRes.data) setCompanies(companiesRes.data as Company[])
    if (!dealsRes.error && dealsRes.data) setDeals(dealsRes.data as Deal[])
    if (!contactsRes.error && contactsRes.data) setContacts(contactsRes.data as Contact[])
    setLoading(false)
  }

  const dealsByCompany = useMemo(() => {
    const map = new Map<number, Deal[]>()
    for (const d of deals) {
      if (d.company_id == null) continue
      const list = map.get(d.company_id) ?? []
      list.push(d)
      map.set(d.company_id, list)
    }
    return map
  }, [deals])

  const contactsByCompany = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of contacts) {
      if (c.company_id == null) continue
      map.set(c.company_id, (map.get(c.company_id) ?? 0) + 1)
    }
    return map
  }, [contacts])

  const filtered = useMemo(() => {
    if (!search.trim()) return companies
    const q = search.toLowerCase()
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    )
  }, [companies, search])

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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Companies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filtered.length} of {companies.length} companies</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      <input
        type="text"
        placeholder="Search name, industry, city…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${inputCls} mb-4`}
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Customer Type</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Contacts</th>
              <th className="px-4 py-3 font-medium">Deals</th>
              <th className="px-4 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No companies yet.</td></tr>
            )}
            {filtered.map((c) => {
              const companyDeals = dealsByCompany.get(c.id) ?? []
              return (
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
                        {c.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {c.customer_type ? COMPANY_CUSTOMER_TYPE_LABELS[c.customer_type] : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.industry || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.city || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{contactsByCompany.get(c.id) ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{companyDeals.length}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-500 whitespace-nowrap">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-slate-50 dark:bg-slate-800/30">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Website</p>
                            <p className="text-slate-700 dark:text-slate-300">{c.website || '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">GST</p>
                            <p className="text-slate-700 dark:text-slate-300">{c.gst || '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Employees</p>
                            <p className="text-slate-700 dark:text-slate-300">{c.employees_range || '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Annual Turnover</p>
                            <p className="text-slate-700 dark:text-slate-300">{c.annual_turnover || '—'}</p>
                          </div>
                          {c.tag && (
                            <div>
                              <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Tag</p>
                              <p className="text-slate-700 dark:text-slate-300">{c.tag}</p>
                            </div>
                          )}
                          {companyDeals.length > 0 && (
                            <div className="col-span-4">
                              <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Deals</p>
                              <div className="flex flex-wrap gap-2">
                                {companyDeals.map((d) => (
                                  <span key={d.id} className="text-xs rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1">
                                    {d.name} — {d.stage}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
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
