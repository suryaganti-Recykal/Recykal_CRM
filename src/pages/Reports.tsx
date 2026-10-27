import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../contexts/ProfileContext'
import { useToast } from '../contexts/ToastContext'
import { DEAL_STAGE_LABELS, PIPELINE_LABELS } from '../lib/types'
import type { DealStage, Pipeline } from '../lib/types'
import { BarChart3, TrendingUp, Trophy, Filter, Save, Trash2 } from 'lucide-react'

interface SavedReport {
  id: string
  name: string
  entity_type: string
  config: Record<string, unknown>
  is_shared: boolean
  created_at: string
}

interface DealStageStat { stage: DealStage; count: number; value: number }
interface OwnerStat { owner: string; won_count: number; won_value: number; total_deals: number }

export default function Reports() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [tab, setTab] = useState<'funnel' | 'leaderboard' | 'saved'>('funnel')
  const [pipeline, setPipeline] = useState<Pipeline | ''>('')
  const [stageStats, setStageStats] = useState<DealStageStat[]>([])
  const [ownerStats, setOwnerStats] = useState<OwnerStat[]>([])
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  async function fetchFunnel() {
    let q = supabase.from('deals').select('stage, value')
    if (pipeline) q = q.eq('pipeline', pipeline)
    const { data } = await q
    const map = new Map<DealStage, { count: number; value: number }>()
    for (const d of data ?? []) {
      const cur = map.get(d.stage) ?? { count: 0, value: 0 }
      cur.count++
      cur.value += d.value ?? 0
      map.set(d.stage, cur)
    }
    const ordered: DealStage[] = ['prospecting', 'qualification', 'proposal', 'negotiation', 'po_received', 'order_confirmation', 'won', 'lost']
    setStageStats(ordered.map((s) => ({ stage: s, count: map.get(s)?.count ?? 0, value: map.get(s)?.value ?? 0 })))
  }

  async function fetchLeaderboard() {
    const { data } = await supabase.from('deals').select('owner, stage, value')
    const map = new Map<string, OwnerStat>()
    for (const d of data ?? []) {
      const key = d.owner ?? 'Unassigned'
      const cur = map.get(key) ?? { owner: key, won_count: 0, won_value: 0, total_deals: 0 }
      cur.total_deals++
      if (d.stage === 'won') { cur.won_count++; cur.won_value += d.value ?? 0 }
      map.set(key, cur)
    }
    setOwnerStats(Array.from(map.values()).sort((a, b) => b.won_value - a.won_value))
  }

  async function fetchSaved() {
    const { data } = await supabase.from('saved_reports').select('*').order('created_at', { ascending: false })
    setSavedReports(data ?? [])
  }

  useEffect(() => { fetchFunnel(); fetchLeaderboard(); fetchSaved() }, [pipeline])

  async function deleteSaved(id: string) {
    await supabase.from('saved_reports').delete().eq('id', id)
    fetchSaved()
  }

  function formatValue(v: number) {
    if (v >= 10000000) return `${(v / 10000000).toFixed(1)} Cr`
    if (v >= 100000) return `${(v / 100000).toFixed(1)} L`
    if (v >= 1000) return `${(v / 1000).toFixed(1)} K`
    return v.toLocaleString('en-IN')
  }

  const maxFunnelCount = Math.max(...stageStats.map((s) => s.count), 1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
        <div className="flex items-center gap-3">
          <select value={pipeline} onChange={(e) => setPipeline(e.target.value as Pipeline | '')} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Pipelines</option>
            {Object.entries(PIPELINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {([['funnel', 'Deal Funnel', BarChart3], ['leaderboard', 'Leaderboard', Trophy], ['saved', 'Saved Reports', Save]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'funnel' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Deal Stage Funnel</h3>
          <div className="space-y-2">
            {stageStats.map((s) => (
              <div key={s.stage} className="flex items-center gap-4">
                <div className="w-36 text-sm font-medium text-slate-700 dark:text-slate-300 text-right">{DEAL_STAGE_LABELS[s.stage]}</div>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                  <div className={`h-full rounded-lg transition-all ${s.stage === 'won' ? 'bg-green-500' : s.stage === 'lost' ? 'bg-red-400' : 'bg-brand-500'}`} style={{ width: `${(s.count / maxFunnelCount) * 100}%` }} />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-slate-700 dark:text-slate-200">{s.count} deals &middot; {formatValue(s.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sales Leaderboard</h3>
          {ownerStats.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No deals found.</p>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">#</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Owner</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Won</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Won Value</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Total Deals</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {ownerStats.map((o, i) => (
                    <tr key={o.owner} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{o.owner}</td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-medium">{o.won_count}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100 font-semibold">{formatValue(o.won_value)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{o.total_deals}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{o.total_deals ? `${Math.round((o.won_count / o.total_deals) * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Saved Reports</h3>
          {savedReports.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No saved reports yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map((r) => (
                <div key={r.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">{r.entity_type ?? 'General'}</p>
                    </div>
                    <button onClick={() => deleteSaved(r.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                  {r.is_shared && <span className="inline-block mt-2 text-[10px] uppercase tracking-wider text-brand-600 dark:text-brand-400 font-medium">Shared</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
