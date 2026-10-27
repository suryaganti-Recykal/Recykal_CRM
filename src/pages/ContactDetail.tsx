import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
  LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  ZONES,
  ZONE_LABELS,
  LEADS_SOURCE_LABELS,
  type Contact,
  type ContactStatus,
  type LifecycleStage,
  type CustomerType,
  type Zone,
  type Deal,
  type Company,
} from '../lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Plus } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import NotesPanel from '../components/NotesPanel'
import ActivityTimeline from '../components/ActivityTimeline'
import FileList from '../components/files/FileList'
import CommunicationTimeline from '../components/communication/CommunicationTimeline'
import EmailComposer from '../components/email/EmailComposer'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">{value || '—'}</p>
    </div>
  )
}

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState<Contact | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingCompany, setLinkingCompany] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const [contactRes, dealsRes, companiesRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).single(),
      supabase.from('deals').select('*').eq('contact_id', id),
      supabase.from('companies').select('*').order('name'),
    ])
    if (!contactRes.error && contactRes.data) setContact(contactRes.data as Contact)
    if (!dealsRes.error && dealsRes.data) setDeals(dealsRes.data as Deal[])
    if (!companiesRes.error && companiesRes.data) setCompanies(companiesRes.data as Company[])
    setLoading(false)
  }

  async function updateStatus(status: ContactStatus) {
    if (!contact) return
    setContact({ ...contact, contact_status: status })
    await supabase
      .from('contacts')
      .update({ contact_status: status, last_contacted_at: status === 'contacted' ? new Date().toISOString() : undefined })
      .eq('id', contact.id)
  }

  async function updateLifecycleStage(lifecycle_stage: LifecycleStage) {
    if (!contact) return
    setContact({ ...contact, lifecycle_stage })
    await supabase.from('contacts').update({ lifecycle_stage }).eq('id', contact.id)
  }

  async function updateCustomerType(customer_type: CustomerType | '') {
    if (!contact) return
    setContact({ ...contact, customer_type: customer_type || null })
    await supabase.from('contacts').update({ customer_type: customer_type || null }).eq('id', contact.id)
  }

  async function updateZone(zone: Zone | '') {
    if (!contact) return
    setContact({ ...contact, zone: zone || null })
    await supabase.from('contacts').update({ zone: zone || null }).eq('id', contact.id)
  }

  async function updateCompany(companyIdStr: string) {
    if (!contact) return
    const company_id = companyIdStr ? Number(companyIdStr) : null
    setContact({ ...contact, company_id })
    await supabase.from('contacts').update({ company_id }).eq('id', contact.id)
  }

  // Leads arrive with a free-text company_name and no Company record. This turns
  // that text into a real Company and links it in one click — reusing an existing
  // Company when the name already matches (case-insensitively) so repeat leads
  // from the same firm don't create duplicates.
  async function createAndLinkCompany() {
    if (!contact?.company_name) return
    const typed = contact.company_name.trim()
    if (!typed) return

    setLinkingCompany(true)
    try {
      const existing = companies.find(
        (c) => c.name.trim().toLowerCase() === typed.toLowerCase()
      )
      let companyId = existing?.id

      if (!companyId) {
        // Carry over whatever location the lead gave us so the new Company isn't
        // created blank. Contacts store city as "Hyderabad (Telangana)", so split
        // that into city + state rather than dumping the whole string into city.
        const rawCity = contact.city?.trim() ?? ''
        const cityPart = rawCity.split('(')[0].trim()
        const statePart = rawCity.includes('(')
          ? rawCity.split('(')[1].replace(')', '').trim()
          : (contact.state?.trim() ?? '')

        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: typed,
            city: cityPart || null,
            state: statePart || null,
          })
          .select('*')
          .single()
        if (error || !data) throw new Error(error?.message ?? 'Could not create company')
        const created = data as Company
        companyId = created.id
        setCompanies((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      }

      const { error: linkError } = await supabase
        .from('contacts')
        .update({ company_id: companyId })
        .eq('id', contact.id)
      if (linkError) throw new Error(linkError.message)

      setContact({ ...contact, company_id: companyId })
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLinkingCompany(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-400 dark:text-slate-500">Loading…</div>
  if (!contact) return <div className="p-8 text-slate-400 dark:text-slate-500">Contact not found.</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
      >
        <ArrowLeft size={15} />
        Back to Contacts
      </button>

      <div className="flex items-center gap-4 mb-8">
        <Avatar label={contact.name ?? contact.email ?? '?'} size={56} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{contact.name || 'Unnamed Contact'}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <select
              value={contact.company_id ?? ''}
              onChange={(e) => updateCompany(e.target.value)}
              className="text-sm text-slate-500 dark:text-slate-400 bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer hover:text-brand-700 dark:hover:text-brand-400"
            >
              <option value="">
                {contact.company_name ? `${contact.company_name} (not linked)` : 'No company'}
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Only offered when the lead brought a company name that isn't linked
                to a Company record yet — the common case for form/import leads. */}
            {contact.company_id == null && contact.company_name?.trim() && (
              <button
                onClick={createAndLinkCompany}
                disabled={linkingCompany}
                className="inline-flex items-center gap-1 rounded-md border border-brand-600 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 disabled:opacity-60"
              >
                <Plus size={12} />
                {linkingCompany ? 'Creating…' : `Create "${contact.company_name.trim()}"`}
              </button>
            )}
          </div>
          {linkError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{linkError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={contact.lifecycle_stage}
            onChange={(e) => updateLifecycleStage(e.target.value as LifecycleStage)}
            className="text-sm rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-2 pr-8"
          >
            {LIFECYCLE_STAGES.map((s) => (
              <option key={s} value={s}>{LIFECYCLE_STAGE_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={contact.contact_status}
            onChange={(e) => updateStatus(e.target.value as ContactStatus)}
            className="text-sm rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-2 pr-8"
          >
            {CONTACT_STATUSES.map((s) => (
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
              <Field label="Email" value={contact.email} />
              <Field label="Phone" value={contact.phone_country && contact.phone ? `${contact.phone_country} ${contact.phone}` : contact.phone} />
              <Field label="Mobile Number" value={contact.mobile_number} />
              <Field label="Job Title" value={contact.job_title} />
              <Field label="Contact Owner" value={contact.contact_owner} />
              <Field label="Inside Sales POC Owner" value={contact.inside_sales_poc_owner} />
              <Field label="Category" value={contact.category} />
              <Field label="Need Help With" value={contact.need_help_with} />
              <Field label="EPR Category" value={contact.epr_category} />
              <Field label="City" value={contact.city} />
              <Field label="State" value={contact.state} />
              <Field label="Region" value={contact.region} />
              <Field label="Tag" value={contact.tag} />
              <Field label="Total Revenue" value={contact.total_revenue != null ? `₹${contact.total_revenue.toLocaleString('en-IN')}` : null} />

              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Customer Type</p>
                <select
                  value={contact.customer_type ?? ''}
                  onChange={(e) => updateCustomerType(e.target.value as CustomerType | '')}
                  className="text-sm rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-1 pr-7"
                >
                  <option value="">— Not set —</option>
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t} value={t}>{CUSTOMER_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Zone</p>
                <select
                  value={contact.zone ?? ''}
                  onChange={(e) => updateZone(e.target.value as Zone | '')}
                  className="text-sm rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-1 pr-7"
                >
                  <option value="">— Not set —</option>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                  ))}
                </select>
              </div>

              <Field label="Leads Source" value={contact.leads_source ? LEADS_SOURCE_LABELS[contact.leads_source] : null} />
              <Field label="Page URL" value={contact.page_url} />
              <Field label="Source" value={contact.source} />
              <Field label="Created" value={format(new Date(contact.created_at), 'MMM d, yyyy, h:mm a')} />
              <Field label="Last Contacted" value={contact.last_contacted_at ? format(new Date(contact.last_contacted_at), 'MMM d, yyyy, h:mm a') : null} />
            </div>
            {contact.reason_not_qualified && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Field label="Reason For Not Qualified" value={contact.reason_not_qualified} />
              </div>
            )}
            {contact.description && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Field label="Description" value={contact.description} />
              </div>
            )}
            {contact.requirement_description && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Field label="Requirement" value={contact.requirement_description} />
              </div>
            )}
            {/* Only populated for recykal.market /partners/ sign-ups. */}
            {(contact.partner_type || contact.service_coverage) && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                {contact.partner_type && <Field label="Partner Type" value={contact.partner_type} />}
                {contact.service_coverage && <Field label="Service Coverage" value={contact.service_coverage} />}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Notes</h2>
            <NotesPanel entityType="contact" entityId={contact.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Activity</h2>
            <ActivityTimeline entityType="contact" entityId={contact.id} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <EmailComposer contactId={contact.id} defaultTo={contact.email ?? ''} contactName={contact.name ?? undefined} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <CommunicationTimeline entityType="contact" entityId={contact.id} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <FileList entityType="contact" entityId={contact.id} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Linked Deals</h2>
            {deals.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No deals linked to this contact.</p>
            ) : (
              <div className="space-y-2">
                {deals.map((d) => (
                  <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{d.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.stage}{d.value ? ` · ₹${d.value.toLocaleString('en-IN')}` : ''}</p>
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
