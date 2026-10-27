import type { Quote, QuoteLineItem } from '../../lib/types'

interface QuotePreviewProps {
  quote: Quote & { items?: QuoteLineItem[] }
  dealName?: string
  companyName?: string
}

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
}

export default function QuotePreview({ quote, dealName, companyName }: QuotePreviewProps) {
  const taxAmount = quote.subtotal * (quote.tax_percent ?? 18) / 100

  return (
    <div className="bg-white text-slate-900 p-8 max-w-3xl mx-auto border border-slate-200 rounded-lg shadow-sm print:shadow-none print:border-0" id="quote-preview">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-green-600">
        <div>
          <h1 className="text-2xl font-bold text-green-700">Recykal</h1>
          <p className="text-xs text-slate-500 mt-1">Circular Economy Platform</p>
          <p className="text-xs text-slate-500">6th Floor, Tresorie, Srinagar Colony</p>
          <p className="text-xs text-slate-500">Hyderabad, Telangana 500073</p>
          <p className="text-xs text-slate-500">GSTIN: 36AAJCR5765R1ZZ</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-900">QUOTATION</h2>
          <p className="text-sm font-semibold text-green-700 mt-1">{quote.quote_number}</p>
          <p className="text-xs text-slate-500 mt-2">Date: {new Date(quote.created_at).toLocaleDateString('en-IN')}</p>
          {quote.valid_until && <p className="text-xs text-slate-500">Valid Until: {new Date(quote.valid_until).toLocaleDateString('en-IN')}</p>}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
        {companyName && <p className="text-sm font-semibold">{companyName}</p>}
        {dealName && <p className="text-sm text-slate-600">Re: {dealName}</p>}
      </div>

      {/* Line Items */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left py-2 px-3 font-semibold text-slate-600">#</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Description</th>
            <th className="text-right py-2 px-3 font-semibold text-slate-600">Qty</th>
            <th className="text-right py-2 px-3 font-semibold text-slate-600">Unit Price</th>
            <th className="text-right py-2 px-3 font-semibold text-slate-600">Discount</th>
            <th className="text-right py-2 px-3 font-semibold text-slate-600">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(quote.items ?? []).map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
              <td className="py-2 px-3">{item.description ?? '—'}</td>
              <td className="text-right py-2 px-3">{item.quantity}</td>
              <td className="text-right py-2 px-3">{fmt(item.unit_price ?? 0)}</td>
              <td className="text-right py-2 px-3">{item.discount_percent ? `${item.discount_percent}%` : '—'}</td>
              <td className="text-right py-2 px-3 font-medium">{fmt(item.total ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span>{fmt(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">GST ({quote.tax_percent ?? 18}%)</span>
            <span>{fmt(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-2">
            <span>Total</span>
            <span className="text-green-700">{fmt(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      {quote.terms && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Terms & Conditions</h3>
          <p className="text-xs text-slate-600 whitespace-pre-line">{quote.terms}</p>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-xs text-slate-600 whitespace-pre-line">{quote.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 pt-4 text-center">
        <p className="text-xs text-slate-400">Thank you for your business</p>
        <p className="text-xs text-slate-400">Recykal Foundation Pvt Ltd | www.recykal.com | info@recykal.com</p>
      </div>

      {/* Print Button */}
      <div className="mt-6 flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Print / Download PDF
        </button>
      </div>
    </div>
  )
}
