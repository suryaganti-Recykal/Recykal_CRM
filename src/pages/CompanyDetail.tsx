import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Company, Deal, Contact } from '../lib/types'
import { COMPANY_CUSTOMER_TYPE_LABELS } from '../lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Building2 } from 'lucide-react'
import NotesPanel from '../components/NotesPanel'
import ActivityTimeline from '../components/ActivityTimeline'
import FileList from '../components/files/FileList'
import CommunicationTimeline from '../components/communication/CommunicationTimeline'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">{value || '—'}</p>
    </div>
  )
}

function formatValue(v: number | null): string {
  if (v == null) return '—'
  return `₹${v.toLocaleString('en-IN')}`
}

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const [companyRes, dealsRes, contactsRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('deals').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    ])
    if (!companyRes.error && companyRes.data) setCompany(companyRes.data as Company)
    if (!dealsRes.error && dealsRes.data) setDeals(dealsRes.data as Deal[])
    if (!contactsRes.error && contactsRes.data) setContacts(contactsRes.data as Contact[])
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-slate-400 dark:text-slate-500">Loading…</div>
  if (!company) return <div className="p-8 text-slate-400 dark:text-slate-500">Company not found.</div>

  const openValue = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + (d.value ?? 0), 0)
  const wonValue = deals.filter((d) => d.stage === 'won').reduce((s, d) => s + (d.value ?? 0), 0)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/companies')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
      >
        <ArrowLeft size={15} />
        Back to Companies
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <Building2 size={24} className="text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{company.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {company.industry || 'No industry set'}
            {company.customer_type && ` · ${COMPANY_CUSTOMER_TYPE_LABELS[company.customer_type]}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Contacts</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{contacts.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Deals</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{deals.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Open Pipeline</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatValue(openValue)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Won Value</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatValue(wonValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Website" value={company.website} />
              <Field label="Domain" value={company.domain} />
              <Field label="GST" value={company.gst} />
              <Field label="Employees" value={company.employees_range} />
              <Field label="Annual Turnover" value={company.annual_turnover} />
              <Field label="Tag" value={company.tag} />
              <Field label="Account Owners" value={company.account_owners} />
              <Field label="City" value={company.city} />
              <Field label="State" value={company.state} />
              <Field label="Added" value={format(new Date(company.created_at), 'MMM d, yyyy')} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Notes</h2>
            <NotesPanel entityType="company" entityId={company.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Activity</h2>
            <ActivityTimeline entityType="company" entityId={company.id} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Contacts</h2>
            {contacts.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No contacts linked to this company yet.</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <Link
                    key={c.id}
                    to={`/contacts/${c.id}`}
                    className="block rounded-lg border border-slate-200 dark:border-slate-800 p-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.email || '—'}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <CommunicationTimeline companyId={company.id} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <FileList entityType="company" entityId={company.id} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Deals</h2>
            {deals.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No deals for this company yet.</p>
            ) : (
              <div className="space-y-2">
                {deals.map((d) => (
                  <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{d.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.stage} · {formatValue(d.value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
