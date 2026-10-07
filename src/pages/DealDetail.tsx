import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import type { Deal, Company, DealStage, Pipeline, DealType, PoType, Zone, LeadsSource } from '../lib/types'
import {
  DEAL_STAGES, DEAL_STAGE_LABELS,
  PIPELINES, PIPELINE_LABELS,
  DEAL_TYPES, DEAL_TYPE_LABELS,
  PO_TYPES, PO_TYPE_LABELS,
  ZONES, ZONE_LABELS,
  LEADS_SOURCES, LEADS_SOURCE_LABELS,
  WASTE_TYPES,
} from '../lib/types'
import NotesPanel from '../components/NotesPanel'
import ActivityTimeline from '../components/ActivityTimeline'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1'

export default function DealDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [deal, setDeal] = useState<Deal | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Deal | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [dealRes, companiesRes] = await Promise.all([
        supabase.from('deals').select('*').eq('id', Number(id)).single(),
        supabase.from('companies').select('*').order('name'),
      ])
      if (dealRes.data) {
        const d = dealRes.data as Deal
        setDeal(d)
        setForm(d)
        if (d.company_id && companiesRes.data) {
          setCompany((companiesRes.data as Company[]).find((c) => c.id === d.company_id) ?? null)
        }
      }
      if (companiesRes.data) setCompanies(companiesRes.data as Company[])
      setLoading(false)
    }
    load()
  }, [id])

  async function save(field: string, value: unknown) {
    const { error } = await supabase.from('deals').update({ [field]: value }).eq('id', Number(id))
    if (error) {
      addToast('Failed to update', 'error')
      setForm(deal)
    } else {
      addToast('Saved', 'success')
      setDeal((prev) => prev ? { ...prev, [field]: value } : prev)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading…</div>
  if (!deal || !form) return <div className="p-8 text-center text-slate-400">Deal not found.</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/deals')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
      >
        <ArrowLeft size={16} /> Back to Deals
      </button>

      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">{deal.name}</h1>
      {company && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{company.name}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Deal Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Deal Name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => form.name !== deal.name && save('name', form.name)} />
              </div>
              <div>
                <label className={labelCls}>Pipeline</label>
                <select className={inputCls} value={form.pipeline} onChange={(e) => { const v = e.target.value as Pipeline; setForm({ ...form, pipeline: v }); save('pipeline', v) }}>
                  {PIPELINES.map((p) => <option key={p} value={p}>{PIPELINE_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Stage</label>
                <select className={inputCls} value={form.stage} onChange={(e) => { const v = e.target.value as DealStage; setForm({ ...form, stage: v }); save('stage', v) }}>
                  {DEAL_STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <select className={inputCls} value={form.company_id ?? ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setForm({ ...form, company_id: v }); save('company_id', v) }}>
                  <option value="">— None —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Value (₹)</label>
                <input type="number" className={inputCls} value={form.value ?? ''} onChange={(e) => setForm({ ...form, value: e.target.value ? Number(e.target.value) : null })} onBlur={() => form.value !== deal.value && save('value', form.value)} />
              </div>
              <div>
                <label className={labelCls}>Probability (%)</label>
                <input type="number" min="0" max="100" className={inputCls} value={form.probability ?? ''} onChange={(e) => setForm({ ...form, probability: e.target.value ? Number(e.target.value) : null })} onBlur={() => form.probability !== deal.probability && save('probability', form.probability)} />
              </div>
              <div>
                <label className={labelCls}>Expected Close</label>
                <input type="date" className={inputCls} value={form.expected_close_date ?? ''} onChange={(e) => { const v = e.target.value || null; setForm({ ...form, expected_close_date: v }); save('expected_close_date', v) }} />
              </div>
              <div>
                <label className={labelCls}>Owner</label>
                <input className={inputCls} value={form.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value || null })} onBlur={() => form.owner !== deal.owner && save('owner', form.owner)} />
              </div>
              <div>
                <label className={labelCls}>Deal Type</label>
                <select className={inputCls} value={form.deal_type ?? ''} onChange={(e) => { const v = (e.target.value || null) as DealType | null; setForm({ ...form, deal_type: v }); save('deal_type', v) }}>
                  <option value="">— Not set —</option>
                  {DEAL_TYPES.map((t) => <option key={t} value={t}>{DEAL_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Leads Source</label>
                <select className={inputCls} value={form.leads_source ?? ''} onChange={(e) => { const v = (e.target.value || null) as LeadsSource | null; setForm({ ...form, leads_source: v }); save('leads_source', v) }}>
                  <option value="">— Not set —</option>
                  {LEADS_SOURCES.map((s) => <option key={s} value={s}>{LEADS_SOURCE_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>PO Type</label>
                <select className={inputCls} value={form.po_type ?? ''} onChange={(e) => { const v = (e.target.value || null) as PoType | null; setForm({ ...form, po_type: v }); save('po_type', v) }}>
                  <option value="">— Not set —</option>
                  {PO_TYPES.map((t) => <option key={t} value={t}>{PO_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Zone</label>
                <select className={inputCls} value={form.zone ?? ''} onChange={(e) => { const v = (e.target.value || null) as Zone | null; setForm({ ...form, zone: v }); save('zone', v) }}>
                  <option value="">— Not set —</option>
                  {ZONES.map((z) => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Services</label>
                <input className={inputCls} value={form.services ?? ''} onChange={(e) => setForm({ ...form, services: e.target.value || null })} onBlur={() => form.services !== deal.services && save('services', form.services)} />
              </div>
              <div>
                <label className={labelCls}>Tag</label>
                <input className={inputCls} value={form.tag ?? ''} onChange={(e) => setForm({ ...form, tag: e.target.value || null })} onBlur={() => form.tag !== deal.tag && save('tag', form.tag)} />
              </div>
              <div>
                <label className={labelCls}>Inside Sales POC</label>
                <input className={inputCls} value={form.inside_sales_poc ?? ''} onChange={(e) => setForm({ ...form, inside_sales_poc: e.target.value || null })} onBlur={() => form.inside_sales_poc !== deal.inside_sales_poc && save('inside_sales_poc', form.inside_sales_poc)} />
              </div>
              <div>
                <label className={labelCls}>Inside Sales POC Owner</label>
                <input className={inputCls} value={form.inside_sales_poc_owner ?? ''} onChange={(e) => setForm({ ...form, inside_sales_poc_owner: e.target.value || null })} onBlur={() => form.inside_sales_poc_owner !== deal.inside_sales_poc_owner && save('inside_sales_poc_owner', form.inside_sales_poc_owner)} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Types of Waste</label>
              <div className="flex flex-wrap gap-1.5">
                {WASTE_TYPES.map((t) => {
                  const active = form.waste_types?.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const next = active ? (form.waste_types ?? []).filter((w) => w !== t) : [...(form.waste_types ?? []), t]
                        setForm({ ...form, waste_types: next })
                        save('waste_types', next.length > 0 ? next : null)
                      }}
                      className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${active ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Created {format(new Date(deal.created_at), 'MMM d, yyyy')} · Updated {format(new Date(deal.updated_at), 'MMM d, yyyy')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Notes</h2>
            <NotesPanel entityType="deal" entityId={deal.id} />
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Activity</h2>
            <ActivityTimeline entityType="deal" entityId={deal.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
