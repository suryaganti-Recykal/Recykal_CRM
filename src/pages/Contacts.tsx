import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  CONTACT_STATUSES,
  LEAD_STATUSES,
  CONTACT_STATUS_LABELS,
  LIFECYCLE_STAGE_LABELS,
  type Contact,
  type ContactStatus,
  type RecykalMarketLead,
  type LifecycleStage,
  type Company,
} from '../lib/types'
import { exportToCsv } from '../lib/csv'
import StatusBadge from '../components/StatusBadge'
import ImportContactsModal from '../components/ImportContactsModal'
import { format } from 'date-fns'
import { Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const PAGE_SIZE = 100

type SourceTag = 'epr' | 'drs' | 'retrace' | 'marketplace' | 'rezolv' | 'resource' | 'market' | 'partner' | 'eprTool' | 'general'

// contacts.source -> badge/filter tag. Set by the form-submit Edge Function,
// one value per website form stream; anything unrecognised falls back to
// 'general' (the plain Contact Us form, which uses source "website_form").
const SOURCE_TAG_BY_VALUE: Record<string, SourceTag> = {
  website_form_epr: 'epr',
  website_form_drs: 'drs',
  website_form_retrace: 'retrace',
  website_form_marketplace: 'marketplace',
  website_form_rezolv: 'rezolv',
  website_form_resource: 'resource',
  // recykal.market /partners/ sign-ups: service providers (credit, insurance,
  // logistics, compliance) rather than material buyers/sellers, which is why
  // they live in contacts and not recykal_market_leads.
  recykal_market_partner: 'partner',
  // EPR assessment tool. Posts via the lead-webhook endpoint rather than
  // form-submit, because a server-to-server caller has no browser Origin.
  epr_tool: 'eprTool',
}

interface UnifiedRow {
  key: string
  table: 'contacts' | 'recykal_market_leads'
  id: number
  name: string | null
  company_name: string | null
  company_id: number | null
  email: string | null
  phone_country: string | null
  phone: string | null
  city: string | null
  category: string | null
  page_url: string | null
  status: ContactStatus
  created_at: string
  sourceTag: SourceTag
  requirement_description: string | null
  need_help_with: string | null
  partner_type: string | null
  service_coverage: string | null
  gst: string | null
  business_type: string | null
  role: string | null
  lifecycleStage: LifecycleStage | null
  customerType: string | null
  zone: string | null
}

function toUnified(c: Contact): UnifiedRow {
  const sourceTag: SourceTag = (c.source ? SOURCE_TAG_BY_VALUE[c.source] : undefined) ?? 'general'
  return {
    key: `contacts-${c.id}`,
    table: 'contacts',
    id: c.id,
    name: c.name,
    company_name: c.company_name,
    company_id: c.company_id,
    email: c.email,
    phone_country: c.phone_country,
    phone: c.phone,
    city: c.city,
    category: c.epr_category || c.category,
    page_url: c.page_url,
    status: c.contact_status,
    created_at: c.created_at,
    sourceTag,
    requirement_description: c.requirement_description,
    need_help_with: c.need_help_with,
    partner_type: c.partner_type,
    service_coverage: c.service_coverage,
    gst: null,
    business_type: null,
    role: null,
    lifecycleStage: c.lifecycle_stage,
    customerType: c.customer_type,
    zone: c.zone,
  }
}

function toUnifiedFromLead(l: RecykalMarketLead): UnifiedRow {
  return {
    key: `market-${l.id}`,
    table: 'recykal_market_leads',
    id: l.id,
    name: l.name,
    company_name: l.company_name,
    company_id: null,
    email: l.email,
    phone_country: l.phone_country,
    phone: l.phone,
    city: l.city,
    category: l.material_category,
    page_url: l.page_category,
    status: l.lead_status,
    created_at: l.created_at,
    sourceTag: 'market',
    requirement_description: null,
    need_help_with: null,
    // recykal_market_leads has no partner columns — these only apply to the
    // /partners/ sign-up form, which writes to contacts.
    partner_type: null,
    service_coverage: null,
    gst: l.gst,
    business_type: l.business_type,
    role: l.role,
    lifecycleStage: null,
    customerType: null,
    zone: null,
  }
}

// One brand colour per lead stream (Brand Guidelines primary palette). Dark mode
// swaps the darker hues for their lightened tints so the text stays legible.
const SOURCE_BADGE: Record<Exclude<SourceTag, 'general'>, string> = {
  epr: 'bg-recykal-bright-blue/10 text-recykal-bright-blue dark:text-recykal-bright-blue-light ring-recykal-bright-blue/20',
  drs: 'bg-recykal-bright-green/10 text-recykal-dark-green dark:text-recykal-bright-green ring-recykal-dark-green/20',
  retrace: 'bg-recykal-purple/10 text-recykal-purple dark:text-recykal-purple-light ring-recykal-purple/20',
  marketplace: 'bg-recykal-fern-green/10 text-recykal-fern-green dark:text-recykal-fern-green-light ring-recykal-fern-green/20',
  rezolv: 'bg-recykal-duke-blue/10 text-recykal-duke-blue dark:text-recykal-bright-blue-light ring-recykal-duke-blue/20',
  resource: 'bg-recykal-blue/10 text-recykal-blue ring-recykal-blue/20',
  market: 'bg-recykal-midnight-blue/10 text-recykal-midnight-blue dark:text-recykal-midnight-blue-light ring-recykal-midnight-blue/20',
  partner: 'bg-recykal-dark-green/10 text-recykal-dark-green dark:text-recykal-bright-green ring-recykal-dark-green/20',
  // Slate, not a brand hue: all eight brand colours are already taken, and a
  // neutral correctly signals a different channel rather than another form.
  eprTool: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20',
}

const SOURCE_LABEL: Record<Exclude<SourceTag, 'general'>, string> = {
  epr: 'EPR',
  drs: 'DRS',
  retrace: 'ReTrace',
  marketplace: 'Scrap Sourcing',
  rezolv: 'Rezolv',
  resource: 'Resource',
  market: 'Recykal.Market',
  partner: 'Partner',
  eprTool: 'EPR Tool',
}

export default function Contacts() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<UnifiedRow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | SourceTag>('all')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [contactsRes, leadsRes, companiesRes] = await Promise.all([
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('recykal_market_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*'),
    ])
    const contactRows = ((contactsRes.data as Contact[]) ?? []).map(toUnified)
    const leadRows = ((leadsRes.data as RecykalMarketLead[]) ?? []).map(toUnifiedFromLead)
    const merged = [...contactRows, ...leadRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setRows(merged)
    if (!companiesRes.error && companiesRes.data) setCompanies(companiesRes.data as Company[])
    setLoading(false)
  }

  const companyById = useMemo(() => {
    const map = new Map<number, Company>()
    for (const c of companies) map.set(c.id, c)
    return map
  }, [companies])

  function resolveCompanyName(r: UnifiedRow): string | null {
    if (r.company_id != null) return companyById.get(r.company_id)?.name ?? r.company_name
    return r.company_name
  }

  async function updateStatus(row: UnifiedRow, status: ContactStatus) {
    setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, status } : r)))
    if (row.table === 'contacts') {
      await supabase
        .from('contacts')
        .update({ contact_status: status, last_contacted_at: status === 'contacted' ? new Date().toISOString() : undefined })
        .eq('id', row.id)
    } else {
      await supabase
        .from('recykal_market_leads')
        .update({ lead_status: status, last_contacted_at: status === 'contacted' ? new Date().toISOString() : undefined })
        .eq('id', row.id)
    }
  }

  const allStatusOptions = useMemo(() => {
    const set = new Set<string>([...CONTACT_STATUSES, ...LEAD_STATUSES])
    return Array.from(set) as ContactStatus[]
  }, [])

  const filtered = useMemo(() => {
    const result = rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (sourceFilter !== 'all' && r.sourceTag !== sourceFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.name?.toLowerCase().includes(q) ||
        resolveCompanyName(r)?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q)
      )
    })
    setPage(0)
    return result
  }, [rows, search, statusFilter, sourceFilter, companyById])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  function handleExport() {
    exportToCsv(
      `contacts_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      filtered.map((r) => ({
        id: r.id,
        source: r.sourceTag,
        name: r.name,
        company: resolveCompanyName(r),
        email: r.email,
        phone: `${r.phone_country ?? ''} ${r.phone ?? ''}`.trim(),
        category: r.category,
        need_help_with: r.need_help_with,
        role: r.role,
        gst: r.gst,
        business_type: r.business_type,
        partner_type: r.partner_type,
        service_coverage: r.service_coverage,
        page: r.page_url,
        city: r.city,
        requirement: r.requirement_description,
        status: r.status,
        created_at: r.created_at,
      }))
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contacts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length === 0 ? 'No inquiries' : `${rangeStart}–${rangeEnd} of ${filtered.length.toLocaleString()} inquiries`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Upload size={15} />
            Import Contacts
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Export CSV
          </button>
        </div>
      </div>

      <ImportContactsModal open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, company, email, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All statuses</option>
          {allStatusOptions.map((s) => (
            <option key={s} value={s}>{CONTACT_STATUS_LABELS[s] ?? s}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as 'all' | SourceTag)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All sources</option>
          <option value="general">General contact form</option>
          <option value="epr">EPR form</option>
          <option value="drs">DRS form</option>
          <option value="retrace">ReTrace form</option>
          <option value="marketplace">Scrap Sourcing form</option>
          <option value="rezolv">Rezolv form</option>
          <option value="resource">Resource (e-book / webinar)</option>
          <option value="market">Recykal.Market</option>
          <option value="partner">Recykal.Market partners</option>
          <option value="eprTool">EPR assessment tool</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Lifecycle Stage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No contacts found.</td></tr>
            )}
            {paged.map((r) => (
              <Fragment key={r.key}>
                <tr
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => setExpandedKey(expandedKey === r.key ? null : r.key)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {/* Both kinds of row open a full detail page now; they just
                        live in different tables, so they route differently. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(r.table === 'contacts' ? `/contacts/${r.id}` : `/market-leads/${r.id}`)
                      }}
                      className="hover:text-brand-700 dark:hover:text-brand-400 hover:underline"
                    >
                      {r.name || '—'}
                    </button>
                    {r.sourceTag !== 'general' && (
                      <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SOURCE_BADGE[r.sourceTag]}`}>
                        {SOURCE_LABEL[r.sourceTag]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{resolveCompanyName(r) || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.city || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {r.lifecycleStage ? LIFECYCLE_STAGE_LABELS[r.lifecycleStage] : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r, e.target.value as ContactStatus)}
                      className="text-xs rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-1 pr-7"
                    >
                      {(r.table === 'contacts' ? CONTACT_STATUSES : LEAD_STATUSES).map((s) => (
                        <option key={s} value={s}>{CONTACT_STATUS_LABELS[s] ?? s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500 whitespace-nowrap">
                    {format(new Date(r.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
                {expandedKey === r.key && (
                  <tr className="bg-slate-50 dark:bg-slate-800/30">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Phone</p>
                          <p className="text-slate-700 dark:text-slate-300">{r.phone_country} {r.phone || '—'}</p>
                        </div>
                        {r.customerType && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Customer Type</p>
                            <p className="text-slate-700 dark:text-slate-300 uppercase">{r.customerType}</p>
                          </div>
                        )}
                        {r.zone && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Zone</p>
                            <p className="text-slate-700 dark:text-slate-300 capitalize">{r.zone}</p>
                          </div>
                        )}
                        {r.need_help_with && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Need Help With</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.need_help_with}</p>
                          </div>
                        )}
                        {r.role && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Role</p>
                            <p className="text-slate-700 dark:text-slate-300 capitalize">{r.role}</p>
                          </div>
                        )}
                        {r.gst && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">GST</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.gst}</p>
                          </div>
                        )}
                        {r.business_type && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Business Type</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.business_type}</p>
                          </div>
                        )}
                        {r.partner_type && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Partner Type</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.partner_type}</p>
                          </div>
                        )}
                        {r.service_coverage && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Coverage</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.service_coverage}</p>
                          </div>
                        )}
                        {r.page_url && (
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Page</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.page_url}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Current status</p>
                          <StatusBadge status={r.status} />
                        </div>
                        {r.requirement_description && (
                          <div className="col-span-4">
                            <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Requirement</p>
                            <p className="text-slate-700 dark:text-slate-300">{r.requirement_description}</p>
                          </div>
                        )}
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
              <button onClick={() => setPage(0)} disabled={page === 0} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" title="First page"><ChevronsLeft size={16} /></button>
              <button onClick={() => setPage(page - 1)} disabled={page === 0} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Previous page"><ChevronLeft size={16} /></button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">{page + 1}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Next page"><ChevronRight size={16} /></button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Last page"><ChevronsRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
