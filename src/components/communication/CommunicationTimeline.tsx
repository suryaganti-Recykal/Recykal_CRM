import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../lib/types'
import { Mail, Phone, Video, Calendar, Clock } from 'lucide-react'

interface TimelineEntry {
  id: string
  type: 'email' | 'call' | 'meeting'
  title: string
  subtitle: string | null
  timestamp: string
  icon: typeof Mail
  color: string
}

interface CommunicationTimelineProps {
  contactId?: number
  dealId?: number
  companyId?: number
}

export default function CommunicationTimeline({ contactId, dealId, companyId }: CommunicationTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const results: TimelineEntry[] = []

      if (contactId || dealId || companyId) {
        let emailQ = supabase.from('emails').select('id, subject, direction, status, created_at')
        if (contactId) emailQ = emailQ.eq('contact_id', contactId)
        else if (dealId) emailQ = emailQ.eq('deal_id', dealId)
        else if (companyId) emailQ = emailQ.eq('company_id', companyId)
        const { data: emails } = await emailQ.order('created_at', { ascending: false }).limit(20)
        for (const e of emails ?? []) {
          results.push({
            id: `email-${e.id}`, type: 'email',
            title: e.subject ?? '(No subject)',
            subtitle: `${e.direction} - ${e.status}`,
            timestamp: e.created_at, icon: Mail, color: 'text-blue-500',
          })
        }

        let callQ = supabase.from('call_logs').select('id, direction, outcome, duration_seconds, notes, called_at')
        if (contactId) callQ = callQ.eq('contact_id', contactId)
        else if (dealId) callQ = callQ.eq('deal_id', dealId)
        const { data: calls } = await callQ.order('called_at', { ascending: false }).limit(20)
        for (const c of calls ?? []) {
          const mins = c.duration_seconds ? `${Math.round(c.duration_seconds / 60)}min` : ''
          results.push({
            id: `call-${c.id}`, type: 'call',
            title: `${c.direction ?? ''} call - ${c.outcome ?? 'unknown'}`,
            subtitle: [mins, c.notes].filter(Boolean).join(' · ') || null,
            timestamp: c.called_at, icon: Phone, color: 'text-green-500',
          })
        }

        let meetQ = supabase.from('meetings').select('id, title, meeting_type, start_time, outcome, created_at')
        if (contactId) meetQ = meetQ.eq('contact_id', contactId)
        else if (dealId) meetQ = meetQ.eq('deal_id', dealId)
        else if (companyId) meetQ = meetQ.eq('company_id', companyId)
        const { data: meetings } = await meetQ.order('created_at', { ascending: false }).limit(20)
        for (const m of meetings ?? []) {
          results.push({
            id: `meeting-${m.id}`, type: 'meeting',
            title: m.title,
            subtitle: [m.meeting_type, m.outcome].filter(Boolean).join(' · ') || null,
            timestamp: m.start_time ?? m.created_at, icon: m.meeting_type === 'video' ? Video : Calendar, color: 'text-purple-500',
          })
        }
      }

      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setEntries(results)
      setLoading(false)
    }
    fetch()
  }, [contactId, dealId, companyId])

  function relativeTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading communications...</div>
  if (entries.length === 0) return <div className="text-sm text-slate-500 dark:text-slate-400">No communications yet.</div>

  return (
    <div className="space-y-3">
      {entries.map((e) => {
        const Icon = e.icon
        return (
          <div key={e.id} className="flex gap-3">
            <div className={`mt-0.5 shrink-0 ${e.color}`}><Icon size={16} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{e.title}</div>
              {e.subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.subtitle}</div>}
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={10} /> {relativeTime(e.timestamp)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
