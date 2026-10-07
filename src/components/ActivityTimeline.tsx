import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActivityEntityType, ActivityLogEntry } from '../lib/types'
import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, ArrowRightCircle, Circle } from 'lucide-react'

const eventIcon: Record<string, typeof Circle> = {
  created: PlusCircle,
  status_change: ArrowRightCircle,
  stage_change: ArrowRightCircle,
  deal_created: PlusCircle,
  deal_stage_change: ArrowRightCircle,
}

export default function ActivityTimeline({ entityType, entityId }: { entityType: ActivityEntityType; entityId: number }) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [entityType, entityId])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    if (!error && data) setEntries(data as ActivityLogEntry[])
    setLoading(false)
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-500">Loading activity…</p>
  if (entries.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500">No activity recorded yet.</p>

  return (
    <div className="space-y-4">
      {entries.map((e) => {
        const Icon = eventIcon[e.event_type] ?? Circle
        return (
          <div key={e.id} className="flex gap-3">
            <Icon size={16} className="text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{e.description}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
