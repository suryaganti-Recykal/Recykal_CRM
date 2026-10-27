import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Clock } from 'lucide-react'

type ActorProfile = { id: string; full_name: string | null; email: string }

interface AuditEntry {
  id: number
  action: string
  field_name: string | null
  old_value: unknown
  new_value: unknown
  actor_id: string | null
  created_at: string
}

interface AuditLogProps {
  entityType: string
  entityId: number
}

export default function AuditLog({ entityType, entityId }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [profiles, setProfiles] = useState<ActorProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const [logRes, profRes] = await Promise.all([
        supabase.from('audit_log').select('*').eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('id, full_name, email'),
      ])
      setEntries(logRes.data ?? [])
      setProfiles(profRes.data ?? [])
      setLoading(false)
    }
    fetch()
  }, [entityType, entityId])

  function actorName(id: string | null) {
    if (!id) return 'System'
    const p = profiles.find((pr) => pr.id === id)
    return p?.full_name ?? p?.email?.split('@')[0] ?? 'Unknown'
  }

  function formatVal(v: unknown): string {
    if (v === null || v === undefined) return '(empty)'
    if (typeof v === 'string') return v
    return JSON.stringify(v)
  }

  function relativeTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading history...</div>
  if (entries.length === 0) return <div className="text-sm text-slate-500 dark:text-slate-400">No changes recorded yet.</div>

  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <div key={e.id} className="flex gap-3">
          <div className="mt-1 shrink-0">
            <Clock size={14} className="text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-slate-900 dark:text-slate-100">
              <span className="font-medium">{actorName(e.actor_id)}</span>
              {' '}
              {e.action === 'create' && 'created this record'}
              {e.action === 'delete' && 'deleted this record'}
              {e.action === 'update' && e.field_name && (
                <>
                  changed <span className="font-medium">{e.field_name}</span>
                  {e.old_value !== null && <> from <span className="text-slate-500 line-through">{formatVal(e.old_value)}</span></>}
                  {' '}to <span className="text-brand-600 dark:text-brand-400">{formatVal(e.new_value)}</span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{relativeTime(e.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
