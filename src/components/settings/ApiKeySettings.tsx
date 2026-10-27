import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import type { ApiKey } from '../../lib/types'
import { Key, Plus, Trash2, Copy, CheckCircle } from 'lucide-react'

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'rck_'
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)]
  return key
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function ApiKeySettings() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function fetchKeys() {
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false })
    setKeys(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchKeys() }, [])

  async function createKey() {
    if (!name.trim()) return
    const raw = generateKey()
    const hash = await hashKey(raw)
    const { error } = await supabase.from('api_keys').insert({
      name: name.trim(),
      key_hash: hash,
      key_prefix: raw.slice(0, 12),
      permissions: { contacts: 'read_write', companies: 'read_write', deals: 'read_write' },
      owner_id: profile?.id ?? null,
    })
    if (error) { addToast(error.message, 'error'); return }
    setNewKey(raw)
    setName('')
    fetchKeys()
  }

  async function deleteKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    await supabase.from('api_keys').delete().eq('id', id)
    fetchKeys()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('api_keys').update({ is_active: !active }).eq('id', id)
    fetchKeys()
  }

  function copyKey() {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">API Keys</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage API keys for external integrations</p>
        </div>
        <button onClick={() => { setShowCreate(true); setNewKey(null) }} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">
          <Plus size={14} /> Create Key
        </button>
      </div>

      {/* New Key Warning */}
      {newKey && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Save your API key now — it won't be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded px-3 py-2 font-mono text-slate-900 dark:text-slate-100 select-all">{newKey}</code>
            <button onClick={copyKey} className="p-2 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30">
              {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} className="text-amber-600" />}
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreate && !newKey && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
          <input type="text" placeholder='Key name (e.g. "Zapier Integration")' value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
          <div className="flex gap-2">
            <button onClick={createKey} disabled={!name.trim()} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">Generate Key</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Key List */}
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="text-center py-12">
          <Key size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
              <Key size={18} className={k.is_active ? 'text-green-500' : 'text-slate-400'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{k.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <code>{k.key_prefix}...</code> · Created {new Date(k.created_at).toLocaleDateString('en-IN')}
                  {k.last_used_at && <> · Last used {new Date(k.last_used_at).toLocaleDateString('en-IN')}</>}
                </div>
              </div>
              <button onClick={() => toggleActive(k.id, k.is_active)} className={`text-xs px-2 py-1 rounded ${k.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {k.is_active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => deleteKey(k.id)} title="Revoke" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
