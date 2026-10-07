import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LEAD_STATUSES,
  LEAD_ROLES,
  CONTACT_STATUS_LABELS,
  type RecykalMarketLead,
  type LeadStatus,
  type LeadRole,
  type Company,
} from '../lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Plus } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import NotesPanel from '../components/NotesPanel'
import ActivityTimeline from '../components/ActivityTimeline'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">{value || '—'}</p>
    </div>
  )
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Homepage',
  plastic: 'Plastic',
  metal: 'Metal',
  electronics: 'Electronics',
  partners: 'Partners',
}

/**
 * Full detail page for a recykal.market lead — the counterpart to ContactDetail,
 * which serves recykal.com contacts. Kept as a separate page rather than folded
 * into ContactDetail because the two live in different tables with independent
 * id sequences and largely different fields (role / material / GST / pincode here
 * vs lifecycle stage / EPR category / revenue there).
 */
export default function MarketLeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState<RecykalMarketLead | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [linkedCompanyId, setLinkedCompanyId] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const [leadRes, companiesRes] = await Promise.all([
      supabase.from('recykal_market_leads').select('*').eq('id', id).single(),
      supabase.from('companies').select('*').order('name'),
    ])
    if (!leadRes.error && leadRes.data) setLead(leadRes.data as RecykalMarketLead)
    if (!companiesRes.error && companiesRes.data) {
      const list = companiesRes.data as Company[]
      setCompanies(list)
      // recykal_market_leads has no company_id column, so a "link" here is
      // resolved by name rather than stored. Surfacing the match still saves the
      // sales team from wondering whether the company already exists.
      const typed = (leadRes.data as RecykalMarketLead | null)?.company_name?.trim().toLowerCase()
      const match = typed ? list.find((c) => c.name.trim().toLowerCase() === typed) : undefined
      setLinkedCompanyId(match?.id ?? null)
    }
    setLoading(false)
  }

  async function updateStatus(lead_status: LeadStatus) {
    if (!lead) return
    setLead({ ...lead, lead_status })
    await supabase
      .from('recykal_market_leads')
      .update({
        lead_status,
        last_contacted_at: lead_status === 'contacted' ? new Date().toISOString() : undefined,
      })
      .eq('id', lead.id)
  }

  async function updateRole(role: LeadRole) {
    if (!lead) return
    setLead({ ...lead, role })
    await supabase.from('recykal_market_leads').update({ role }).eq('id', lead.id)
  }

  // Mirrors ContactDetail: turn the lead's free-text company_name into a real
  // Company, reusing an existing one when the name already matches
  // case-insensitively so repeat leads from the same firm don't duplicate it.
  async function createCompany() {
    if (!lead?.company_name?.trim()) return
    const typed = lead.company_name.trim()

    setCreatingCompany(true)
    setCompanyError(null)
    try {
      const existing = companies.find((c) => c.name.trim().toLowerCase() === typed.toLowerCase())
      if (existing) {
        setLinkedCompanyId(existing.id)
        return
      }
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: typed,
          city: lead.city,
          state: lead.state,
          gst: lead.gst,
        })
        .select('*')
        .single()
      // Report what the database returned, never what we sent.
      if (error) {
        setCompanyError(error.message)
        return
      }
      setCompanies((prev) => [...prev, data as Company])
      setLinkedCompanyId((data as Company).id)
    } finally {
      setCreatingCompany(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
  }
  if (!lead) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Lead not found.</p>
        <button onClick={() => navigate('/contacts')} className="mt-3 text-sm text-brand-700 dark:text-brand-400 hover:underline">
          Back to Contacts
        </button>
      </div>
    )
  }

  const linkedCompany = companies.find((c) => c.id === linkedCompanyId)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
      >
        <ArrowLeft size={15} />
        Back to Contacts
      </button>

      <div className="flex items-center gap-4 mb-8">
        <Avatar label={lead.name ?? lead.email ?? '?'} size={56} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {lead.name || 'Unnamed Lead'}
            </h1>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-recykal-midnight-blue/10 text-recykal-midnight-blue dark:text-recykal-midnight-blue-light ring-recykal-midnight-blue/20">
              Recykal.Market
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {linkedCompany
                ? linkedCompany.name
                : lead.company_name
                  ? `${lead.company_name} (no company record)`
                  : 'No company'}
            </span>
            {!linkedCompany && lead.company_name?.trim() && (
              <button
                onClick={createCompany}
                disabled={creatingCompany}
                className="inline-flex items-center gap-1 rounded-md border border-brand-600 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 disabled:opacity-60"
              >
                <Plus size={12} />
                {creatingCompany ? 'Creating…' : `Create "${lead.company_name.trim()}"`}
              </button>
            )}
          </div>
          {companyError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{companyError}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lead.role}
            onChange={(e) => updateRole(e.target.value as LeadRole)}
            className="text-sm rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-2 pr-8 capitalize"
          >
            {LEAD_ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
          <select
            value={lead.lead_status}
            onChange={(e) => updateStatus(e.target.value as LeadStatus)}
            className="text-sm rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-2 pr-8"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{CONTACT_STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={lead.email} />
              <Field
                label="Phone"
                value={lead.phone_country && lead.phone ? `${lead.phone_country} ${lead.phone}` : lead.phone}
              />
              <Field label="GST" value={lead.gst} />
              <Field label="Business Type" value={lead.business_type} />
              <Field label="Material Category" value={lead.material_category} />
              <Field label="Submitted From" value={PAGE_LABELS[lead.page_category] ?? lead.page_category} />
              <Field label="City" value={lead.city} />
              <Field label="State" value={lead.state} />
              <Field label="Pincode" value={lead.pincode} />
              <Field label="Source" value={lead.source} />
              <Field label="Created" value={format(new Date(lead.created_at), 'MMM d, yyyy, h:mm a')} />
              <Field
                label="Last Contacted"
                value={lead.last_contacted_at ? format(new Date(lead.last_contacted_at), 'MMM d, yyyy, h:mm a') : null}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Notes</h2>
            <NotesPanel entityType="market_lead" entityId={lead.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Activity</h2>
            <ActivityTimeline entityType="market_lead" entityId={lead.id} />
          </div>

          {/* Submission provenance. Kept in the sidebar rather than Details because
              it is diagnostic — it is how the curl-injected junk rows of
              2026-08-15 were identified as scripted rather than organic. */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Submission</h2>
            <div className="space-y-3">
              <Field label="IP Address" value={lead.ip_address} />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">User Agent</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 break-words">{lead.user_agent || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
