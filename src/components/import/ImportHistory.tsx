import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ImportJob } from '../../lib/types'
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-slate-500' },
  processing: { icon: Loader2, color: 'text-blue-500' },
  completed: { icon: CheckCircle, color: 'text-green-500' },
  failed: { icon: AlertCircle, color: 'text-red-500' },
}

export default function ImportHistory() {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('import_jobs').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setJobs(data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">Loading import history...</div>
  if (jobs.length === 0) return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No imports yet.</p>

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Import History</h3>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Entity</th>
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">File</th>
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Total</th>
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Created</th>
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Failed</th>
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const cfg = statusConfig[j.status] ?? statusConfig.pending
              const Icon = cfg.icon
              return (
                <tr key={j.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2.5 px-4"><Icon size={16} className={`${cfg.color} ${j.status === 'processing' ? 'animate-spin' : ''}`} /></td>
                  <td className="py-2.5 px-4 capitalize text-slate-700 dark:text-slate-300">{j.entity_type}</td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 truncate max-w-48">{j.file_name ?? '—'}</td>
                  <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">{j.total_rows}</td>
                  <td className="py-2.5 px-4 text-right text-green-600 dark:text-green-400">{j.created_count}</td>
                  <td className="py-2.5 px-4 text-right text-red-600 dark:text-red-400">{j.failed_count}</td>
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{new Date(j.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
