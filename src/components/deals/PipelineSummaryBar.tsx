import { TrendingUp, Hash, Target, Clock } from 'lucide-react'
import type { DealSummary } from '../../hooks/useDeals'

function formatINR(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

const tiles = [
  { key: 'totalValue', label: 'Open Pipeline', icon: TrendingUp, format: formatINR },
  { key: 'dealCount', label: 'Open Deals', icon: Hash, format: (v: number) => String(v) },
  { key: 'weightedForecast', label: 'Weighted Forecast', icon: Target, format: formatINR },
  { key: 'avgAgeDays', label: 'Avg Deal Age', icon: Clock, format: (v: number) => `${v}d` },
] as const

export default function PipelineSummaryBar({ summary }: { summary: DealSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map(({ key, label, icon: Icon, format }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <Icon size={18} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
              {format(summary[key])}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
