import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import type { Product, ProductCategory, ProductUnit } from '../../lib/types'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, PRODUCT_UNITS, PRODUCT_UNIT_LABELS } from '../../lib/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function ProductSettings() {
  const { addToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState<string>('')
  const [unit, setUnit] = useState<ProductUnit | ''>('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [saving, setSaving] = useState(false)

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  function openCreate() {
    setEditing(null); setName(''); setCode(''); setDescription(''); setUnitPrice(''); setUnit(''); setCategory(''); setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing(p); setName(p.name); setCode(p.code ?? ''); setDescription(p.description ?? '')
    setUnitPrice(p.unit_price?.toString() ?? ''); setUnit(p.unit ?? ''); setCategory(p.category ?? ''); setShowForm(true)
  }

  async function handleSave() {
    if (!name.trim()) { addToast('Product name is required', 'error'); return }
    setSaving(true)
    const payload = {
      name: name.trim(), code: code.trim() || null, description: description.trim() || null,
      unit_price: unitPrice ? parseFloat(unitPrice) : null, unit: unit || null, category: category || null,
    }
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) addToast(error.message, 'error'); else addToast('Product updated', 'success')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) addToast(error.message, 'error'); else addToast('Product created', 'success')
    }
    setSaving(false); setShowForm(false); fetchProducts()
  }

  async function toggleActive(p: Product) {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    fetchProducts()
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading products...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Products & Services</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your product catalog for deal line items.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus size={16} /> New Product
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editing ? 'Edit Product' : 'New Product'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Code (SKU)</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EPR-PLT-001" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">None</option>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{PRODUCT_CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as ProductUnit)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">None</option>
                {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{PRODUCT_UNIT_LABELS[u]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Default Price</label>
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No products yet.</p>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Code</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Price</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {products.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${!p.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.code ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.category ? PRODUCT_CATEGORY_LABELS[p.category] : '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{p.unit_price?.toLocaleString('en-IN') ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${p.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Pencil size={14} /></button>
                      <button onClick={() => toggleActive(p)} title={p.is_active ? 'Deactivate' : 'Activate'} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
