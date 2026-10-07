import { Search } from 'lucide-react'
import type { Pipeline } from '../../lib/types'
import { PIPELINES, PIPELINE_LABELS } from '../../lib/types'
import type { DealFilters as Filters } from '../../hooks/useDeals'

const selectCls =
  'rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export default function DealFilters({
  filters,
  setFilters,
  owners,
}: {
  filters: Filters
  setFilters: (f: Filters) => void
  owners: string[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search deals…"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>
      <select
        className={selectCls}
        value={filters.pipeline}
        onChange={(e) => setFilters({ ...filters, pipeline: e.target.value as 'all' | Pipeline })}
      >
        <option value="all">All pipelines</option>
        {PIPELINES.map((p) => (
          <option key={p} value={p}>{PIPELINE_LABELS[p]}</option>
        ))}
      </select>
      <select
        className={selectCls}
        value={filters.owner}
        onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
      >
        <option value="">All owners</option>
        {owners.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
