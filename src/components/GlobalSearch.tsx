import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, X, User, Building2, Handshake } from 'lucide-react'

interface SearchResult {
  type: 'contact' | 'company' | 'deal'
  id: number
  title: string
  subtitle: string | null
}

const ICONS = { contact: User, company: Building2, deal: Handshake }
const ROUTES = { contact: '/contacts', company: '/companies', deal: '/deals' }

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => { if (open) { inputRef.current?.focus(); setQuery(''); setResults([]) } }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const q = `%${query.trim()}%`
      const [contacts, companies, deals] = await Promise.all([
        supabase.from('contacts').select('id, name, email, company_name').ilike('name', q).limit(5),
        supabase.from('companies').select('id, name, industry').ilike('name', q).limit(5),
        supabase.from('deals').select('id, name, pipeline').ilike('name', q).limit(5),
      ])
      const r: SearchResult[] = [
        ...(contacts.data ?? []).map((c) => ({ type: 'contact' as const, id: c.id, title: c.name ?? c.email ?? 'Unnamed', subtitle: c.company_name })),
        ...(companies.data ?? []).map((c) => ({ type: 'company' as const, id: c.id, title: c.name, subtitle: c.industry })),
        ...(deals.data ?? []).map((d) => ({ type: 'deal' as const, id: d.id, title: d.name, subtitle: d.pipeline })),
      ]
      setResults(r)
      setSelectedIdx(0)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  function go(r: SearchResult) {
    navigate(`${ROUTES[r.type]}/${r.id}`)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[selectedIdx]) { go(results[selectedIdx]) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search contacts, companies, deals..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => {
              const Icon = ICONS[r.type]
              return (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    onClick={() => go(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Icon size={16} className="shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</div>
                      {r.subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.subtitle}</div>}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">{r.type}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {query.trim() && results.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No results found</div>
        )}

        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs text-slate-400">
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">↵</kbd> open</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
