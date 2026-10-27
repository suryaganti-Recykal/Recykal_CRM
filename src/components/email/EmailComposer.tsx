import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import type { EmailTemplate } from '../../lib/types'
import { Send, FileText } from 'lucide-react'

interface EmailComposerProps {
  contactId?: number
  dealId?: number
  companyId?: number
  defaultTo?: string
  contactName?: string
  onSent?: () => void
}

export default function EmailComposer({ contactId, dealId, companyId, defaultTo, contactName, onSent }: EmailComposerProps) {
  const { addToast } = useToast()
  const [to, setTo] = useState(defaultTo ?? '')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    supabase.from('email_templates').select('*').order('name').then(({ data }) => setTemplates(data ?? []))
  }, [])

  function applyTemplate(t: EmailTemplate) {
    let s = t.subject ?? ''
    let b = t.body_html ?? ''
    if (contactName) {
      s = s.replace(/\{\{contact\.name\}\}/g, contactName)
      b = b.replace(/\{\{contact\.name\}\}/g, contactName)
    }
    setSubject(s)
    setHtml(b)
    setShowTemplates(false)
  }

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !html.trim()) { addToast('Fill in all fields', 'error'); return }
    setSending(true)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        to: to.split(',').map((e) => e.trim()).filter(Boolean),
        subject,
        html,
        contact_id: contactId ?? null,
        deal_id: dealId ?? null,
        company_id: companyId ?? null,
      }),
    })

    const result = await res.json()
    setSending(false)

    if (res.ok) {
      addToast('Email sent', 'success')
      setSubject('')
      setHtml('')
      onSent?.()
    } else {
      addToast(result.error ?? 'Failed to send', 'error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Send Email</h4>
        <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
          <FileText size={12} /> Templates
        </button>
      </div>

      {showTemplates && templates.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
          {templates.map((t) => (
            <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              {t.name} <span className="text-xs text-slate-400">— {t.subject}</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="To (email addresses, comma-separated)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
      />
      <textarea
        placeholder="Email body (HTML supported)"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        rows={5}
        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-y"
      />
      <button
        onClick={handleSend}
        disabled={sending || !to.trim() || !subject.trim()}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={14} /> {sending ? 'Sending...' : 'Send Email'}
      </button>
    </div>
  )
}
