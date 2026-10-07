import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { useDeals } from '../hooks/useDeals'
import type { Deal, DealStage, Pipeline } from '../lib/types'
import {
  DEAL_STAGES, DEAL_STAGE_LABELS,
  PIPELINES, PIPELINE_LABELS,
  DEAL_TYPES, DEAL_TYPE_LABELS,
  PO_TYPES, PO_TYPE_LABELS,
  ZONES, ZONE_LABELS,
  LEADS_SOURCES, LEADS_SOURCE_LABELS,
  WASTE_TYPES,
} from '../lib/types'
import Modal from '../components/ui/Modal'
import KanbanBoard from '../components/deals/KanbanBoard'
import DealFilters from '../components/deals/DealFilters'
import PipelineSummaryBar from '../components/deals/PipelineSummaryBar'
import DealSlideOver from '../components/deals/DealSlideOver'
import QuickAddCard from '../components/deals/QuickAddCard'
import { formatValue, PIPELINE_BADGE } from '../components/deals/DealCard'

import type { DealType, PoType, Zone, LeadsSource } from '../lib/types'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

interface NewDeal {
  name: string; company_id: string; value: string; stage: DealStage; pipeline: Pipeline
  probability: string; expected_close_date: string; owner: string; deal_type: DealType | ''
  leads_source: LeadsSource | ''; waste_types: string[]; services: string; po_type: PoType | ''
  zone: Zone | ''; tag: string; inside_sales_poc: string; inside_sales_poc_owner: string
}

const emptyForm: NewDeal = {
  name: '', company_id: '', value: '', stage: 'prospecting', pipeline: 'epr',
  probability: '', expected_close_date: '', owner: '', deal_type: '', leads_source: '',
  waste_types: [], services: '', po_type: '', zone: '', tag: '', inside_sales_poc: '', inside_sales_poc_owner: '',
}

export default function Deals() {
  const {
    companies, companyById, loading, filters, setFilters,
    visibleDeals, dealsByStage, owners, summary,
    updateStage, createDeal, updateDeal,
  } = useDeals()

  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewDeal>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [quickAddStage, setQuickAddStage] = useState<DealStage | null>(null)

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    const result = await createDeal({
      name: form.name,
      company_id: form.company_id ? Number(form.company_id) : null,
      value: form.value ? Number(form.value) : null,
      stage: form.stage,
      pipeline: form.pipeline,
      probability: form.probability ? Number(form.probability) : null,
      expected_close_date: form.expected_close_date || null,
      owner: form.owner || null,
      deal_type: form.deal_type || null,
      leads_source: form.leads_source || null,
      waste_types: form.waste_types.length > 0 ? form.waste_types : null,
      services: form.services || null,
      po_type: form.po_type || null,
      zone: form.zone || null,
      tag: form.tag || null,
      inside_sales_poc: form.inside_sales_poc || null,
      inside_sales_poc_owner: form.inside_sales_poc_owner || null,
    })
    setSaving(false)
    if (result) {
      setModalOpen(false)
      setForm(emptyForm)
    }
  }

  function toggleWasteType(type: string) {
    setForm((prev) => ({
      ...prev,
      waste_types: prev.waste_types.includes(type) ? prev.waste_types.filter((t) => t !== type) : [...prev.waste_types, type],
    }))
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Deals</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900">
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md ${view === 'kanban' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md ${view === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <PipelineSummaryBar summary={summary} />
        <DealFilters filters={filters} setFilters={setFilters} owners={owners} />
      </div>

      {loading && <div className="text-slate-400 dark:text-slate-500 py-8 text-center">Loading…</div>}

      {!loading && view === 'kanban' && (
        <KanbanBoard
          dealsByStage={dealsByStage}
          companyById={companyById}
          allDeals={visibleDeals}
          onCardClick={(deal) => setSelectedDeal(deal)}
          onQuickAdd={(stage) => setQuickAddStage(stage)}
          onStageChange={(id, stage, extra) => updateStage(id, stage, extra)}
        />
      )}

      {!loading && view === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Deal</th>
                <th className="px-4 py-3 font-medium">Pipeline</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Close Date</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleDeals.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No deals yet.</td></tr>
              )}
              {visibleDeals.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDeal(d)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PIPELINE_BADGE[d.pipeline]}`}>
                      {PIPELINE_LABELS[d.pipeline]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.company_id != null ? companyById.get(d.company_id)?.name ?? '—' : '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatValue(d.value)}</td>
                  <td className="px-4 py-3 text-xs">{DEAL_STAGE_LABELS[d.stage]}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.expected_close_date ? format(new Date(d.expected_close_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.owner || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {quickAddStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setQuickAddStage(null)} />
          <div className="relative w-80">
            <QuickAddCard
              stage={quickAddStage}
              companies={companies}
              onAdd={async (data) => {
                await createDeal({ ...data, pipeline: filters.pipeline !== 'all' ? filters.pipeline : 'epr' })
                setQuickAddStage(null)
              }}
              onClose={() => setQuickAddStage(null)}
            />
          </div>
        </div>
      )}

      {selectedDeal && (
        <DealSlideOver
          deal={selectedDeal}
          companyById={companyById}
          companies={companies}
          onClose={() => setSelectedDeal(null)}
          onUpdate={updateDeal}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Deal">
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Deal Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Pipeline</label>
              <select className={inputCls} value={form.pipeline} onChange={(e) => setForm({ ...form, pipeline: e.target.value as Pipeline })}>
                {PIPELINES.map((p) => <option key={p} value={p}>{PIPELINE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Stage</label>
              <select className={inputCls} value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}>
                {DEAL_STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <select className={inputCls} value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                <option value="">— None —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Value (₹)</label>
              <input type="number" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Deal Type</label>
              <select className={inputCls} value={form.deal_type} onChange={(e) => setForm({ ...form, deal_type: e.target.value as DealType | '' })}>
                <option value="">— Not set —</option>
                {DEAL_TYPES.map((t) => <option key={t} value={t}>{DEAL_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Leads Source</label>
              <select className={inputCls} value={form.leads_source} onChange={(e) => setForm({ ...form, leads_source: e.target.value as LeadsSource | '' })}>
                <option value="">— Not set —</option>
                {LEADS_SOURCES.map((s) => <option key={s} value={s}>{LEADS_SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>PO Type</label>
              <select className={inputCls} value={form.po_type} onChange={(e) => setForm({ ...form, po_type: e.target.value as PoType | '' })}>
                <option value="">— Not set —</option>
                {PO_TYPES.map((t) => <option key={t} value={t}>{PO_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Zone</label>
              <select className={inputCls} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value as Zone | '' })}>
                <option value="">— Not set —</option>
                {ZONES.map((z) => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Probability (%)</label>
              <input type="number" min="0" max="100" className={inputCls} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Expected Close Date</label>
              <input type="date" className={inputCls} value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Owner</label>
              <input className={inputCls} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Services</label>
              <input className={inputCls} placeholder="e.g. EPR (Plastic)" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Tag</label>
              <input className={inputCls} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Inside Sales POC</label>
              <input className={inputCls} value={form.inside_sales_poc} onChange={(e) => setForm({ ...form, inside_sales_poc: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Inside Sales POC Owner</label>
              <input className={inputCls} value={form.inside_sales_poc_owner} onChange={(e) => setForm({ ...form, inside_sales_poc_owner: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Types of Waste</label>
            <div className="flex flex-wrap gap-2">
              {WASTE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleWasteType(t)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    form.waste_types.includes(t)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
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
              {saving ? 'Saving…' : 'Add Deal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
