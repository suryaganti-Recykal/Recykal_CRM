import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import type { DealLineItem, Product } from '../../lib/types'
import { Plus, Trash2 } from 'lucide-react'

interface DealLineItemsProps {
  dealId: number
}

export default function DealLineItems({ dealId }: DealLineItemsProps) {
  const { addToast } = useToast()
  const [items, setItems] = useState<DealLineItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [productId, setProductId] = useState<string>('')
  const [desc, setDesc] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState<number | null>(null)
  const [discount, setDiscount] = useState(0)

  async function fetchItems() {
    const { data } = await supabase.from('deal_line_items').select('*, product:products(*)').eq('deal_id', dealId).order('created_at')
    setItems(data ?? [])
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name')
    setProducts(data ?? [])
  }

  useEffect(() => { fetchItems(); fetchProducts() }, [dealId])

  function selectProduct(pid: string) {
    setProductId(pid)
    const p = products.find((x) => x.id === pid)
    if (p) { setDesc(p.name); setPrice(p.unit_price) }
  }

  async function addItem() {
    if (!desc.trim() && !productId) return
    const unitPrice = price ?? 0
    const total = qty * unitPrice * (1 - discount / 100)
    const { error } = await supabase.from('deal_line_items').insert({
      deal_id: dealId,
      product_id: productId || null,
      description: desc.trim() || null,
      quantity: qty,
      unit_price: unitPrice,
      discount_percent: discount,
      total,
    })
    if (error) addToast(error.message, 'error')
    else {
      setShowForm(false); setProductId(''); setDesc(''); setQty(1); setPrice(null); setDiscount(0)
      fetchItems()
    }
  }

  async function removeItem(id: string) {
    await supabase.from('deal_line_items').delete().eq('id', id)
    fetchItems()
  }

  const grandTotal = items.reduce((s, i) => s + (i.total ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Line Items</h4>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"><Plus size={14} /> Add Item</button>
      </div>

      {items.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400">Description</th>
                <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Qty</th>
                <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Price</th>
                <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Disc %</th>
                <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Total</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{item.description ?? item.product?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{item.unit_price?.toLocaleString('en-IN') ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{item.discount_percent}%</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-100">{item.total?.toLocaleString('en-IN') ?? '—'}</td>
                  <td className="px-3 py-2"><button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <td colSpan={4} className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Grand Total</td>
                <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">{grandTotal.toLocaleString('en-IN')}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Product (optional)</label>
              <select value={productId} onChange={(e) => selectProduct(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Ad-hoc item</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
              <input type="number" value={qty} onChange={(e) => setQty(+e.target.value)} min={1} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit Price</label>
              <input type="number" value={price ?? ''} onChange={(e) => setPrice(e.target.value ? +e.target.value : null)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Discount %</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} min={0} max={100} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
