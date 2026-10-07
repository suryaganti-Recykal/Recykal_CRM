import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APPLICATION_STATUSES, type CareerApplication, type ApplicationStatus } from '../lib/types'
import { exportToCsv } from '../lib/csv'
import StatusBadge from '../components/StatusBadge'
import { format } from 'date-fns'

export default function CareerApplications() {
  const [rows, setRows] = useState<CareerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('career_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setRows(data as CareerApplication[])
    setLoading(false)
  }

  async function updateStatus(id: number, status: ApplicationStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, application_status: status } : r)))
    await supabase
      .from('career_applications')
      .update({ application_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.application_status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const fullName = `${r.first_name ?? ''} ${r.last_name ?? ''}`.toLowerCase()
      return fullName.includes(q) || r.email?.toLowerCase().includes(q) || r.interest_area?.toLowerCase().includes(q)
    })
  }, [rows, search, statusFilter])

  function handleExport() {
    exportToCsv(
      `career_applications_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      filtered.map((r) => ({
        id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        phone: `${r.phone_country ?? ''} ${r.phone ?? ''}`.trim(),
        interest_area: r.interest_area,
        page_url: r.page_url,
        status: r.application_status,
        created_at: r.created_at,
      }))
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Career Applications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filtered.length} of {rows.length} applications</p>
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
          placeholder="Search name, email, interest area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Interest Area</th>
              <th className="px-4 py-3 font-medium">Page</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No applications found.</td></tr>
            )}
            {filtered.map((r) => (
              <Fragment key={r.id}>
                <tr
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.phone_country} {r.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.interest_area || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.page_url || '—'}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.application_status}
                      onChange={(e) => updateStatus(r.id, e.target.value as ApplicationStatus)}
                      className="text-xs rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 py-1 pr-7"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500 whitespace-nowrap">
                    {format(new Date(r.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr className="bg-slate-50 dark:bg-slate-800/30">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Current status</p>
                          <StatusBadge status={r.application_status} />
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Interview scheduled</p>
                          <p className="text-slate-700 dark:text-slate-300">{r.interview_scheduled ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Reviewed by</p>
                          <p className="text-slate-700 dark:text-slate-300">{r.reviewed_by || '—'}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
