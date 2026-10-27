import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import type { Quote, QuoteLineItem } from '../../lib/types'
import { Plus, FileText, Send } from 'lucide-react'

interface QuoteBuilderProps {
  dealId: number
}

export default function QuoteBuilder({ dealId }: QuoteBuilderProps) {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [quotes, setQuotes] = useState<(Quote & { items?: QuoteLineItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function fetchQuotes() {
    const { data } = await supabase.from('quotes').select('*, items:quote_line_items(*)').eq('deal_id', dealId).order('created_at', { ascending: false })
    setQuotes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchQuotes() }, [dealId])

  async function createFromLineItems() {
    setCreating(true)
    const { data: lineItems } = await supabase.from('deal_line_items').select('*').eq('deal_id', dealId)
    const items = lineItems ?? []
    const subtotal = items.reduce((s, i) => s + (i.total ?? 0), 0)
    const taxPercent = 18
    const total = subtotal * (1 + taxPercent / 100)

    const { data: quote, error } = await supabase.from('quotes').insert({
      deal_id: dealId,
      subtotal,
      tax_percent: taxPercent,
      total,
      created_by: profile?.id ?? null,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }).select().single()

    if (error || !quote) { addToast(error?.message ?? 'Failed to create quote', 'error'); setCreating(false); return }

    if (items.length > 0) {
      await supabase.from('quote_line_items').insert(
        items.map((i) => ({
          quote_id: quote.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_percent: i.discount_percent,
          total: i.total,
        }))
      )
    }

    addToast(`Quote ${quote.quote_number} created`, 'success')
    setCreating(false)
    fetchQuotes()
  }

  async function updateStatus(quoteId: string, status: string) {
    const update: Record<string, unknown> = { status }
    if (status === 'sent') update.sent_at = new Date().toISOString()
    await supabase.from('quotes').update(update).eq('id', quoteId)
    fetchQuotes()
  }

  function formatValue(v: number) {
    return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  }

  const statusColors: Record<string, string> = {
    draft: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
    sent: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    accepted: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    rejected: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    expired: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading quotes...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quotes</h4>
        <button onClick={createFromLineItems} disabled={creating} className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline">
          <Plus size={14} /> {creating ? 'Creating...' : 'Create from Line Items'}
        </button>
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No quotes yet.</p>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{q.quote_number}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Valid until {q.valid_until ?? '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${statusColors[q.status] ?? ''}`}>{q.status}</span>
                  {q.status === 'draft' && (
                    <button onClick={() => updateStatus(q.id, 'sent')} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"><Send size={12} /> Mark Sent</button>
                  )}
                  {q.status === 'sent' && (
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus(q.id, 'accepted')} className="text-xs text-green-600 hover:underline">Accept</button>
                      <button onClick={() => updateStatus(q.id, 'rejected')} className="text-xs text-red-600 hover:underline">Reject</button>
                    </div>
                  )}
                </div>
              </div>

              {q.items && q.items.length > 0 && (
                <table className="w-full text-xs mb-3">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400">
                      <th className="text-left py-1">Item</th>
                      <th className="text-right py-1">Qty</th>
                      <th className="text-right py-1">Price</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.items.map((i) => (
                      <tr key={i.id} className="text-slate-700 dark:text-slate-300">
                        <td className="py-1">{i.description ?? '—'}</td>
                        <td className="text-right py-1">{i.quantity}</td>
                        <td className="text-right py-1">{i.unit_price?.toLocaleString('en-IN') ?? '—'}</td>
                        <td className="text-right py-1">{i.total?.toLocaleString('en-IN') ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex justify-end gap-4 text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-slate-500 dark:text-slate-400">Subtotal: {formatValue(q.subtotal)}</span>
                <span className="text-slate-500 dark:text-slate-400">GST ({q.tax_percent}%): {formatValue(q.subtotal * q.tax_percent / 100)}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">Total: {formatValue(q.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
