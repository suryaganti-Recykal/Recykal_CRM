import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Quote, QuoteLineItem } from '../lib/types'
import QuotePreview from '../components/quotes/QuotePreview'
import { FileText, Eye, X, Search } from 'lucide-react'

type QuoteRow = Quote & { items?: QuoteLineItem[]; deals?: { title: string; companies?: { name: string } | null } | null }

const statusColors: Record<string, string> = {
  draft: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
  sent: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  accepted: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  rejected: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  expired: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [preview, setPreview] = useState<QuoteRow | null>(null)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('quotes')
        .select('*, items:quote_line_items(*), deals(title, companies(name))')
        .order('created_at', { ascending: false })
      setQuotes(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = quotes.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (!q.quote_number?.toLowerCase().includes(s) && !q.deals?.title?.toLowerCase().includes(s)) return false
    }
    return true
  })

  function formatValue(v: number) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
    return `₹${v.toLocaleString('en-IN')}`
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quotes</h1>
        <div className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} quote{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading quotes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No quotes found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create quotes from deal pages</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Quote #</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Deal</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Valid Until</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{q.quote_number}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{q.deals?.title ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{q.deals?.companies?.name ?? '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${statusColors[q.status] ?? ''}`}>{q.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">{formatValue(q.total)}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => setPreview(q)} title="Preview" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Quote Preview — {preview.quote_number}</h3>
              <button onClick={() => setPreview(null)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-4">
              <QuotePreview quote={preview} dealName={preview.deals?.title} companyName={preview.deals?.companies?.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
