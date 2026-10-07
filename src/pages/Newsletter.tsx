import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SUBSCRIPTION_STATUSES, type NewsletterSubscriber, type SubscriptionStatus } from '../lib/types'
import { exportToCsv } from '../lib/csv'
import { format } from 'date-fns'

export default function Newsletter() {
  const [rows, setRows] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })
    if (!error && data) setRows(data as NewsletterSubscriber[])
    setLoading(false)
  }

  async function updateStatus(id: number, status: SubscriptionStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, subscription_status: status } : r)))
    await supabase
      .from('newsletter_subscribers')
      .update({
        subscription_status: status,
        unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
      })
      .eq('id', id)
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.subscription_status !== statusFilter) return false
      if (!search.trim()) return true
      return r.email.toLowerCase().includes(search.toLowerCase())
    })
  }, [rows, search, statusFilter])

  function handleExport() {
    exportToCsv(
      `newsletter_subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      filtered.map((r) => ({
        id: r.id,
        email: r.email,
        status: r.subscription_status,
        subscribed_at: r.subscribed_at,
      }))
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Newsletter Subscribers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filtered.length} of {rows.length} subscribers</p>
        </div>
        <button
          onClick={handleExport}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'all')}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All statuses</option>
          {SUBSCRIPTION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No subscribers found.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={r.subscription_status}
                    onChange={(e) => updateStatus(r.id, e.target.value as SubscriptionStatus)}
                    className="text-xs rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-1 pr-7"
                  >
                    {SUBSCRIPTION_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-500 whitespace-nowrap">
                  {format(new Date(r.subscribed_at), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
